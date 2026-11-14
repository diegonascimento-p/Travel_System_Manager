/** Unit distances are shown in: miles ("mi") or kilometers ("km"). Distances are always stored in miles. */
export type DistanceUnit = "mi" | "km";

export const DISTANCE_UNITS: readonly DistanceUnit[] = ["mi", "km"];

/** The user's account preferences. */
export interface UserSettings {
  distanceUnit: DistanceUnit;
}
