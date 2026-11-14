/** Unit distances are shown in. Distances are always stored and calculated in miles. */
export type DistanceUnit = "mi" | "km";

/** The user's account preferences, as saved by the settings API. */
export interface UserSettings {
  distanceUnit: DistanceUnit;
}

/** Unit used until the user chooses one. */
export const DEFAULT_DISTANCE_UNIT: DistanceUnit = "mi";
