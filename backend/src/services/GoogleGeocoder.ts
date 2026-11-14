import type { Coordinates } from "../models/Event.js";
import type { Geocoder } from "./Geocoder.js";

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

interface GeocodeResponse {
  status: string;
  results?: { geometry: { location: { lat: number; lng: number } } }[];
}

/** Geocodes addresses with the Google Geocoding API, caching results per address. */
export class GoogleGeocoder implements Geocoder {
  private readonly cache = new Map<string, Promise<Coordinates | null>>();

  constructor(
    private readonly apiKey: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  geocode(address: string): Promise<Coordinates | null> {
    const key = address.trim().toLowerCase();
    let cached = this.cache.get(key);
    if (!cached) {
      cached = this.request(address).catch((error) => {
        this.cache.delete(key);
        throw error;
      });
      this.cache.set(key, cached);
    }
    return cached;
  }

  private async request(address: string): Promise<Coordinates | null> {
    const url = new URL(GEOCODE_URL);
    url.searchParams.set("address", address);
    url.searchParams.set("key", this.apiKey);
    const response = await this.fetchFn(url);
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}`);
    }
    const body = (await response.json()) as GeocodeResponse;
    if (body.status === "ZERO_RESULTS") return null;
    if (body.status !== "OK") {
      throw new Error(`Geocoding failed with status ${body.status}`);
    }
    const location = body.results?.[0]?.geometry.location;
    return location ? { latitude: location.lat, longitude: location.lng } : null;
  }
}
