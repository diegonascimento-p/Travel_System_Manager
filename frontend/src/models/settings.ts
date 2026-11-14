import type { DistanceUnit } from "./distanceUnit";

/** Settings saved on the signed-in user's profile. */
export interface UserSettings {
  /** Address mileage for calendar events is measured from; null until saved. */
  baseAddress: string | null;
  /** Unit every distance in the app is shown in. */
  distanceUnit: DistanceUnit;
}

export const MAX_BASE_ADDRESS_LENGTH = 300;
