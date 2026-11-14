import type { DistanceUnit } from "../models/distanceUnit";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Formats a YYYY-MM-DD date as "15 March 2024" without shifting it across time zones. */
export function formatEventDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** Formats miles with at most one decimal, or "N/A" when unknown. */
export function formatMiles(miles: number | null): string {
  if (miles === null) return "N/A";
  return String(Math.round(miles * 10) / 10);
}

const distanceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** Formats a distance in miles with at most one decimal and thousands separators, e.g. "1,234.5 mi". */
export function formatDistance(miles: number): string {
  return `${distanceFormat.format(miles)} mi`;
}

const METERS_PER_UNIT: Record<DistanceUnit, number> = { miles: 1609.344, kilometers: 1000 };
const UNIT_LABEL: Record<DistanceUnit, string> = { miles: "mi", kilometers: "km" };

/**
 * Formats a distance stored in meters in the user's unit with at most one decimal, e.g. "10 mi" or
 * "21 km". Returns an empty string when the distance is unknown, so nothing is shown.
 */
export function formatMeters(meters: number | null, unit: DistanceUnit): string {
  if (meters === null) return "";
  return `${distanceFormat.format(meters / METERS_PER_UNIT[unit])} ${UNIT_LABEL[unit]}`;
}
