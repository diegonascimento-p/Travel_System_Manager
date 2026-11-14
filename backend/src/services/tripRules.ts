import type { TripInput } from "../models/Trip.js";

export const MAX_PLACE_LENGTH = 200;
export const MAX_PURPOSE_LENGTH = 500;
export const MAX_DISTANCE = 100_000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type TripField = keyof TripInput;
export type FieldErrors = Partial<Record<TripField, string>>;

export type ValidationResult =
  | { ok: true; value: TripInput }
  | { ok: false; errors: FieldErrors };

/** Checks a trip submitted by a client and returns it trimmed, or a message per invalid field. */
export function validateTripInput(raw: unknown): ValidationResult {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};
  const date = checkDate(body.date, errors);
  const origin = checkText(body.origin, "Origin", MAX_PLACE_LENGTH, "origin", errors);
  const destination = checkText(body.destination, "Destination", MAX_PLACE_LENGTH, "destination", errors);
  const distance = checkDistance(body.distance, errors);
  const purpose = checkText(body.purpose, "Purpose", MAX_PURPOSE_LENGTH, "purpose", errors);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { date, origin, destination, distance, purpose } };
}

/** True when the value is a real calendar date written YYYY-MM-DD. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** First and last day (YYYY-MM-DD) of a YYYY-MM month, or null when the month is invalid. */
export function monthBounds(month: unknown): { from: string; to: string } | null {
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

/** Validates list paging; missing values fall back to the first page of the default size. */
export function pageParams(
  limit: number | undefined,
  offset: number | undefined,
): { limit: number; offset: number } | null {
  const size = limit ?? DEFAULT_PAGE_SIZE;
  const start = offset ?? 0;
  if (!Number.isInteger(size) || size < 1 || size > MAX_PAGE_SIZE) return null;
  if (!Number.isInteger(start) || start < 0) return null;
  return { limit: size, offset: start };
}

/** Rounds a distance to two decimals so sums of miles do not show floating point noise. */
export function roundDistance(distance: number): number {
  return Math.round(distance * 100) / 100;
}

function checkDate(value: unknown, errors: FieldErrors): string {
  if (value === undefined || value === null || value === "") errors.date = "Date is required.";
  else if (!isIsoDate(value)) errors.date = "Date must be a valid date (YYYY-MM-DD).";
  return typeof value === "string" ? value : "";
}

function checkText(
  value: unknown,
  label: string,
  maxLength: number,
  field: TripField,
  errors: FieldErrors,
): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (value !== undefined && value !== null && typeof value !== "string") errors[field] = `${label} must be text.`;
  else if (text === "") errors[field] = `${label} is required.`;
  else if (text.length > maxLength) errors[field] = `${label} must be at most ${maxLength} characters.`;
  return text;
}

function checkDistance(value: unknown, errors: FieldErrors): number {
  if (value === undefined || value === null || value === "") {
    errors.distance = "Distance is required.";
    return 0;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.distance = "Distance must be a number.";
    return 0;
  }
  if (value <= 0) errors.distance = "Distance must be greater than zero.";
  else if (value > MAX_DISTANCE) errors.distance = `Distance must be at most ${MAX_DISTANCE} miles.`;
  return value;
}
