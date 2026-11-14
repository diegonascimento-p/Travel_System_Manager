/** Settings saved on the signed-in user's profile. */
export interface UserProfile {
  /** Address mileage for calendar events is measured from; null until the user saves one. */
  baseAddress: string | null;
}
