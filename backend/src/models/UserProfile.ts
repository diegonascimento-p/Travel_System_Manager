/** Unit the user's distances are shown in. */
export type DistanceUnit = "miles" | "kilometers";

export const DISTANCE_UNITS: readonly DistanceUnit[] = ["miles", "kilometers"];

/** Unit for users who have not chosen one. */
export const DEFAULT_DISTANCE_UNIT: DistanceUnit = "miles";

/** Settings saved on the signed-in user's profile. */
export interface UserProfile {
  /** Address mileage for calendar events is measured from; null until the user saves one. */
  baseAddress: string | null;
  /** Unit every distance in the app is shown in. */
  distanceUnit: DistanceUnit;
}
