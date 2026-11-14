/** Settings saved on the signed-in user's profile. */
export interface UserSettings {
  /** Address mileage for calendar events is measured from; null until saved. */
  baseAddress: string | null;
}

export const MAX_BASE_ADDRESS_LENGTH = 300;
