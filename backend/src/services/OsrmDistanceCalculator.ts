import type { Coordinates } from "../models/Event.js";
import type { DistanceCalculator } from "./DistanceCalculator.js";
import type { Geocoder } from "./Geocoder.js";

export const DEFAULT_OSRM_URL = "https://router.project-osrm.org";
/** Keeps each table request well under the public OSRM server's coordinate limit. */
const MAX_ADDRESSES = 50;
const REQUEST_TIMEOUT_MS = 15_000;

export interface OsrmOptions {
  /** Identifies the app to the OSRM server. */
  userAgent: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

interface TableResponse {
  code: string;
  /** distances[source][destination] in meters; null when there is no road route. */
  distances?: (number | null)[][];
}

interface Located {
  address: string;
  coordinates: Coordinates;
}

/**
 * Driving distances in meters from the OSRM table service. Addresses are resolved to coordinates
 * with the given Geocoder; an address it cannot find, or one with no road route, is left out of the
 * result. A failing geocoder or OSRM request rejects the whole call.
 */
export class OsrmDistanceCalculator implements DistanceCalculator {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(
    private readonly geocoder: Geocoder,
    private readonly options: OsrmOptions,
  ) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_OSRM_URL).replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async metersFrom(origin: string, destinations: string[]): Promise<Map<string, number>> {
    return this.oneToMany(origin, destinations, "from");
  }

  async metersTo(origins: string[], destination: string): Promise<Map<string, number>> {
    return this.oneToMany(destination, origins, "to");
  }

  /** Meters between `hub` and each of `others`, driving from the hub (`from`) or to it (`to`). */
  private async oneToMany(hub: string, others: string[], direction: "from" | "to"): Promise<Map<string, number>> {
    const [hubCoordinates, located] = await Promise.all([this.geocoder.geocode(hub), this.locate(others)]);
    const meters = new Map<string, number>();
    if (hubCoordinates === null) return meters;
    for (const batch of chunk(located, MAX_ADDRESSES)) {
      const distances = await this.table(hubCoordinates, batch.map((place) => place.coordinates), direction);
      batch.forEach((place, index) => {
        const value = distances[index];
        if (typeof value === "number") meters.set(place.address, value);
      });
    }
    return meters;
  }

  /** The unique addresses the geocoder can find, with their coordinates. */
  private async locate(addresses: string[]): Promise<Located[]> {
    const unique = [...new Set(addresses)];
    const coordinates = await Promise.all(unique.map((address) => this.geocoder.geocode(address)));
    return unique.flatMap((address, i) => (coordinates[i] ? [{ address, coordinates: coordinates[i] }] : []));
  }

  /** One OSRM table request; returns the meters per entry of `others`, in order. */
  private async table(hub: Coordinates, others: Coordinates[], direction: "from" | "to"): Promise<(number | null)[]> {
    const path = [hub, ...others].map(({ latitude, longitude }) => `${longitude},${latitude}`).join(";");
    const otherIndexes = others.map((_, i) => String(i + 1)).join(";");
    const url = new URL(`${this.baseUrl}/table/v1/driving/${path}`);
    url.searchParams.set("sources", direction === "from" ? "0" : otherIndexes);
    url.searchParams.set("destinations", direction === "from" ? otherIndexes : "0");
    url.searchParams.set("annotations", "distance");

    const response = await this.fetchFn(url, {
      headers: { "User-Agent": this.options.userAgent, Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`OSRM request failed with status ${response.status}`);
    }
    const body = (await response.json()) as TableResponse;
    if (body.code !== "Ok" || !body.distances) {
      throw new Error(`OSRM failed with code ${body.code}`);
    }
    return direction === "from" ? (body.distances[0] ?? []) : body.distances.map((row) => row[0] ?? null);
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
