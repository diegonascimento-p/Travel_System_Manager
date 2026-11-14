import type { Coordinates } from "../models/Event.js";
import type { Geocoder } from "./Geocoder.js";

export const DEFAULT_NOMINATIM_URL = "https://nominatim.openstreetmap.org";
/** Nominatim's usage policy allows at most one request per second. */
export const NOMINATIM_MIN_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 10_000;

export interface NominatimOptions {
  /** Identifies the app to Nominatim, as its usage policy requires. */
  userAgent: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
  /** Clock and sleep, replaceable in tests. */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

interface SearchResult {
  lat: string;
  lon: string;
}

/**
 * Geocodes addresses with OpenStreetMap Nominatim, following its usage policy: requests are sent one
 * at a time at most once per second with an identifying User-Agent, and results (including "not
 * found") are cached in memory per address. Failures are not cached, so they are retried next time.
 */
export class NominatimGeocoder implements Geocoder {
  private readonly cache = new Map<string, Promise<Coordinates | null>>();
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = Number.NEGATIVE_INFINITY;

  constructor(private readonly options: NominatimOptions) {
    this.baseUrl = options.baseUrl ?? DEFAULT_NOMINATIM_URL;
    this.fetchFn = options.fetchFn ?? fetch;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  geocode(address: string): Promise<Coordinates | null> {
    const key = address.trim().toLowerCase();
    let cached = this.cache.get(key);
    if (!cached) {
      cached = this.throttled(() => this.request(address.trim())).catch((error) => {
        this.cache.delete(key);
        throw error;
      });
      this.cache.set(key, cached);
    }
    return cached;
  }

  /** Runs requests one after another, at least NOMINATIM_MIN_INTERVAL_MS apart. */
  private throttled<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastRequestAt + NOMINATIM_MIN_INTERVAL_MS - this.now();
      if (wait > 0) await this.sleep(wait);
      this.lastRequestAt = this.now();
      return task();
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async request(address: string): Promise<Coordinates | null> {
    const url = new URL(`${this.baseUrl.replace(/\/+$/, "")}/search`);
    url.searchParams.set("q", address);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    const response = await this.fetchFn(url, {
      headers: { "User-Agent": this.options.userAgent, Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Nominatim request failed with status ${response.status}`);
    }
    return toCoordinates((await response.json()) as SearchResult[]);
  }
}

function toCoordinates(results: SearchResult[]): Coordinates | null {
  const first = Array.isArray(results) ? results[0] : undefined;
  if (!first) return null;
  const latitude = Number(first.lat);
  const longitude = Number(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Nominatim returned invalid coordinates");
  }
  return { latitude, longitude };
}
