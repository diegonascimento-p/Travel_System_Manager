import type { DistanceUnit } from "../models/settings";

/** Kilometers in one mile (international mile). */
export const KM_PER_MILE = 1.609344;

/** Converts a distance in miles to the unit. */
export function convertMiles(miles: number, unit: DistanceUnit): number {
  return unit === "km" ? miles * KM_PER_MILE : miles;
}

/** Sum of the known distances, unrounded, so totals do not drift from rounding each distance first. */
export function totalMiles(distances: (number | null)[]): number {
  return distances.reduce<number>((sum, miles) => sum + (miles ?? 0), 0);
}

const distanceFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Formats a distance stored in miles in the unit, with one decimal place, thousands separators
 * and the unit label, e.g. "1,234.5 mi" or "16.1 km"; "N/A" when the distance is unknown.
 */
export function formatDistance(miles: number | null, unit: DistanceUnit): string {
  if (miles === null) return "N/A";
  return `${distanceFormat.format(convertMiles(miles, unit))} ${unit}`;
}
