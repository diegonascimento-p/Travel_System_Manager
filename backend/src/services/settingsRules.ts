import { DISTANCE_UNITS, type DistanceUnit, type UserSettings } from "../models/Settings.js";

/** Settings of a user who never chose any: distances in miles. */
export const DEFAULT_SETTINGS: UserSettings = { distanceUnit: "mi" };

export type SettingsValidation =
  | { ok: true; value: UserSettings }
  | { ok: false; errors: Record<string, string> };

export function isDistanceUnit(value: unknown): value is DistanceUnit {
  return typeof value === "string" && (DISTANCE_UNITS as readonly string[]).includes(value);
}

/** Checks a settings request body: `distanceUnit` must be "mi" or "km". */
export function validateSettingsInput(raw: unknown): SettingsValidation {
  const unit = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>).distanceUnit : undefined;
  if (!isDistanceUnit(unit)) {
    return { ok: false, errors: { distanceUnit: 'Distance unit must be "mi" or "km".' } };
  }
  return { ok: true, value: { distanceUnit: unit } };
}
