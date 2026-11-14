import type { Coordinates } from "../models/Event.js";

export interface Geocoder {
  /** Resolves a free-text address to coordinates, or null when it cannot be found. */
  geocode(address: string): Promise<Coordinates | null>;
}
