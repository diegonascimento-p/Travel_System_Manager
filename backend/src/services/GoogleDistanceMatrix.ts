import type { DistanceCalculator } from "./DistanceCalculator.js";

const DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";
/** The Distance Matrix API accepts at most 25 origins and 25 destinations per request. */
const MAX_ADDRESSES = 25;

interface DistanceMatrixElement {
  status: string;
  distance?: { value: number };
}

interface DistanceMatrixResponse {
  status: string;
  rows?: { elements: DistanceMatrixElement[] }[];
}

interface Leg {
  origin: string;
  destination: string;
}

/** Driving distances in meters from the Google Distance Matrix API, cached per origin and destination. */
export class GoogleDistanceMatrix implements DistanceCalculator {
  private readonly cache = new Map<string, Promise<number | null>>();

  constructor(
    private readonly apiKey: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async metersFrom(origin: string, destinations: string[]): Promise<Map<string, number>> {
    const unique = [...new Set(destinations)];
    const legs = unique.map((destination) => ({ origin, destination }));
    for (const batch of chunk(this.uncached(legs), MAX_ADDRESSES)) {
      this.requestLegs([origin], batch.map((leg) => leg.destination), batch, (index) => [0, index]);
    }
    return this.collect(legs, (leg) => leg.destination);
  }

  async metersTo(origins: string[], destination: string): Promise<Map<string, number>> {
    const unique = [...new Set(origins)];
    const legs = unique.map((origin) => ({ origin, destination }));
    for (const batch of chunk(this.uncached(legs), MAX_ADDRESSES)) {
      this.requestLegs(batch.map((leg) => leg.origin), [destination], batch, (index) => [index, 0]);
    }
    return this.collect(legs, (leg) => leg.origin);
  }

  private uncached(legs: Leg[]): Leg[] {
    return legs.filter((leg) => !this.cache.has(cacheKey(leg)));
  }

  private async collect(legs: Leg[], keyOf: (leg: Leg) => string): Promise<Map<string, number>> {
    const meters = new Map<string, number>();
    for (const leg of legs) {
      const value = await this.cache.get(cacheKey(leg))!;
      if (value !== null) meters.set(keyOf(leg), value);
    }
    return meters;
  }

  /** Starts one API request and caches a pending result per leg; `cell` locates a leg's row and element. */
  private requestLegs(
    origins: string[],
    destinations: string[],
    legs: Leg[],
    cell: (index: number) => [number, number],
  ): void {
    const request = this.request(origins, destinations);
    legs.forEach((leg, index) => {
      const key = cacheKey(leg);
      const [row, column] = cell(index);
      const result = request.then((body) => toMeters(body.rows?.[row]?.elements?.[column]));
      result.catch(() => this.cache.delete(key));
      this.cache.set(key, result);
    });
  }

  private async request(origins: string[], destinations: string[]): Promise<DistanceMatrixResponse> {
    const url = new URL(DISTANCE_MATRIX_URL);
    url.searchParams.set("origins", origins.join("|"));
    url.searchParams.set("destinations", destinations.join("|"));
    url.searchParams.set("mode", "driving");
    url.searchParams.set("key", this.apiKey);
    const response = await this.fetchFn(url);
    if (!response.ok) {
      throw new Error(`Distance Matrix request failed with status ${response.status}`);
    }
    const body = (await response.json()) as DistanceMatrixResponse;
    if (body.status !== "OK") {
      throw new Error(`Distance Matrix failed with status ${body.status}`);
    }
    return body;
  }
}

function toMeters(element: DistanceMatrixElement | undefined): number | null {
  if (element?.status !== "OK" || element.distance === undefined) return null;
  return element.distance.value;
}

function cacheKey({ origin, destination }: Leg): string {
  return `${origin.trim().toLowerCase()}\n${destination.trim().toLowerCase()}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
