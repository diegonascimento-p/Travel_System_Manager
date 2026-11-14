import type { DistanceCalculator } from "./DistanceCalculator.js";

export const METERS_PER_MILE = 1609.344;

/**
 * Round-trip driving meters for each location: base address to the location plus the location back
 * to the base address. A location missing from the result could not be routed in either direction.
 */
export async function roundTripMeters(
  distances: DistanceCalculator,
  baseAddress: string,
  locations: string[],
): Promise<Map<string, number>> {
  const [there, back] = await Promise.all([
    distances.metersFrom(baseAddress, locations),
    distances.metersTo(locations, baseAddress),
  ]);
  const roundTrips = new Map<string, number>();
  for (const location of locations) {
    const out = there.get(location);
    const home = back.get(location);
    if (out !== undefined && home !== undefined) roundTrips.set(location, out + home);
  }
  return roundTrips;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}
