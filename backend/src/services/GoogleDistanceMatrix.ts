import type { DistanceCalculator } from "./DistanceCalculator.js";

const DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";
/** The Distance Matrix API accepts at most 25 destinations per request. */
const MAX_DESTINATIONS = 25;
const METERS_PER_MILE = 1609.344;

interface DistanceMatrixResponse {
  status: string;
  rows?: { elements: { status: string; distance?: { value: number } }[] }[];
}

/** Driving distances from the Google Distance Matrix API, cached per origin and destination. */
export class GoogleDistanceMatrix implements DistanceCalculator {
  private readonly cache = new Map<string, Promise<number | null>>();

  constructor(
    private readonly apiKey: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async milesFrom(origin: string, destinations: string[]): Promise<Map<string, number>> {
    const unique = [...new Set(destinations)];
    const missing = unique.filter((destination) => !this.cache.has(cacheKey(origin, destination)));
    for (const batch of chunk(missing, MAX_DESTINATIONS)) this.requestBatch(origin, batch);

    const miles = new Map<string, number>();
    for (const destination of unique) {
      const value = await this.cache.get(cacheKey(origin, destination))!;
      if (value !== null) miles.set(destination, value);
    }
    return miles;
  }

  /** Starts one API request for the batch and caches a pending result per destination. */
  private requestBatch(origin: string, destinations: string[]): void {
    const request = this.request(origin, destinations);
    destinations.forEach((destination, index) => {
      const key = cacheKey(origin, destination);
      const result = request.then((miles) => miles[index]);
      result.catch(() => this.cache.delete(key));
      this.cache.set(key, result);
    });
  }

  private async request(origin: string, destinations: string[]): Promise<(number | null)[]> {
    const url = new URL(DISTANCE_MATRIX_URL);
    url.searchParams.set("origins", origin);
    url.searchParams.set("destinations", destinations.join("|"));
    url.searchParams.set("mode", "driving");
    url.searchParams.set("units", "imperial");
    url.searchParams.set("key", this.apiKey);
    const response = await this.fetchFn(url);
    if (!response.ok) {
      throw new Error(`Distance Matrix request failed with status ${response.status}`);
    }
    const body = (await response.json()) as DistanceMatrixResponse;
    if (body.status !== "OK") {
      throw new Error(`Distance Matrix failed with status ${body.status}`);
    }
    const elements = body.rows?.[0]?.elements ?? [];
    return destinations.map((_, index) => toMiles(elements[index]));
  }
}

function toMiles(element: { status: string; distance?: { value: number } } | undefined): number | null {
  if (element?.status !== "OK" || element.distance === undefined) return null;
  return element.distance.value / METERS_PER_MILE;
}

function cacheKey(origin: string, destination: string): string {
  return `${origin.trim().toLowerCase()}\n${destination.trim().toLowerCase()}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
