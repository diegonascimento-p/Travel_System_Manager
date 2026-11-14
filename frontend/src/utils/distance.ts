import type { DistanceUnit } from "../models/distanceUnit";

/** Kilometers in one mile (international mile). */
export const KM_PER_MILE = 1.609344;
const METERS_PER_MILE = KM_PER_MILE * 1000;

const UNIT_LABEL: Record<DistanceUnit, string> = { miles: "mi", kilometers: "km" };

/** Converts a distance in miles to the unit. */
export function convertMiles(miles: number, unit: DistanceUnit): number {
  return unit === "kilometers" ? miles * KM_PER_MILE : miles;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

/** Sum of the known distances, unrounded, so totals do not drift from rounding each distance first. */
export function totalDistance(distances: (number | null)[]): number {
  return distances.reduce<number>((sum, distance) => sum + (distance ?? 0), 0);
}

const distanceFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Formats a distance stored in miles in the unit, with one decimal place, thousands separators
 * and the unit label, e.g. "1,234.5 mi" or "16.1 km"; "N/A" when the distance is unknown.
 */
export function formatDistance(miles: number | null, unit: DistanceUnit): string {
  if (miles === null) return "N/A";
  return `${distanceFormat.format(convertMiles(miles, unit))} ${UNIT_LABEL[unit]}`;
}

/**
 * Formats a distance stored in meters like `formatDistance`, e.g. "10.0 mi" or "21.0 km".
 * Returns an empty string when the distance is unknown, so nothing is shown.
 */
export function formatMeters(meters: number | null, unit: DistanceUnit): string {
  if (meters === null) return "";
  return formatDistance(metersToMiles(meters), unit);
}
