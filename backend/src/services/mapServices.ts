import type { DistanceCalculator } from "./DistanceCalculator.js";
import type { Geocoder } from "./Geocoder.js";
import { NominatimGeocoder } from "./NominatimGeocoder.js";
import { OsrmDistanceCalculator } from "./OsrmDistanceCalculator.js";

export const DEFAULT_MAPS_USER_AGENT =
  "TravelSystemManager/0.1 (+https://github.com/diegonascimento-p/Travel_System_Manager)";

export interface MapServices {
  geocoder: Geocoder;
  distanceCalculator: DistanceCalculator;
}

type Env = Record<string, string | undefined>;

/**
 * The OpenStreetMap geocoder (Nominatim) and driving distance calculator (OSRM), configured from the
 * environment. No variable is required: they default to the public servers and the app's User-Agent.
 */
export function createMapServices(env: Env, fetchFn: typeof fetch = fetch): MapServices {
  const userAgent = nonEmpty(env.MAPS_USER_AGENT) ?? DEFAULT_MAPS_USER_AGENT;
  const geocoder = new NominatimGeocoder({ userAgent, baseUrl: nonEmpty(env.NOMINATIM_URL), fetchFn });
  const distanceCalculator = new OsrmDistanceCalculator(geocoder, { userAgent, baseUrl: nonEmpty(env.OSRM_URL), fetchFn });
  return { geocoder, distanceCalculator };
}

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}
