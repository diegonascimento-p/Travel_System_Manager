import type { Trip, TripFieldErrors, TripInput } from "../models/trip";

export const MAX_PLACE_LENGTH = 200;
export const MAX_PURPOSE_LENGTH = 500;
export const MAX_DISTANCE = 100_000;

/** What the user typed in the trip form; every field is text until validated. */
export interface TripFormValues {
  date: string;
  origin: string;
  destination: string;
  distance: string;
  purpose: string;
}

export type TripFormResult = { ok: true; input: TripInput } | { ok: false; errors: TripFieldErrors };

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function emptyTripForm(date: string): TripFormValues {
  return { date, origin: "", destination: "", distance: "", purpose: "" };
}

export function tripToForm(trip: Trip): TripFormValues {
  return {
    date: trip.date,
    origin: trip.origin,
    destination: trip.destination,
    distance: String(trip.distance),
    purpose: trip.purpose,
  };
}

/** Validates the form with the same rules as the API and converts it to a trip to save. */
export function validateTripForm(values: TripFormValues): TripFormResult {
  const errors: TripFieldErrors = {};
  const date = values.date.trim();
  if (!date) errors.date = "Date is required.";
  else if (!isRealDate(date)) errors.date = "Enter a valid date.";
  const origin = requiredText(values.origin, "Origin", MAX_PLACE_LENGTH, (m) => (errors.origin = m));
  const destination = requiredText(values.destination, "Destination", MAX_PLACE_LENGTH, (m) => (errors.destination = m));
  const distance = parseDistance(values.distance, (m) => (errors.distance = m));
  const purpose = requiredText(values.purpose, "Purpose", MAX_PURPOSE_LENGTH, (m) => (errors.purpose = m));
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { date, origin, destination, distance, purpose } };
}

function requiredText(value: string, label: string, maxLength: number, fail: (message: string) => void): string {
  const text = value.trim();
  if (!text) fail(`${label} is required.`);
  else if (text.length > maxLength) fail(`${label} must be at most ${maxLength} characters.`);
  return text;
}

function parseDistance(value: string, fail: (message: string) => void): number {
  const text = value.trim();
  if (!text) {
    fail("Distance is required.");
    return 0;
  }
  if (!NUMBER.test(text)) {
    fail("Distance must be a number.");
    return 0;
  }
  const distance = Number(text);
  if (distance <= 0) fail("Distance must be greater than zero.");
  else if (distance > MAX_DISTANCE) fail(`Distance must be at most ${MAX_DISTANCE.toLocaleString("en-US")} miles.`);
  return distance;
}

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
