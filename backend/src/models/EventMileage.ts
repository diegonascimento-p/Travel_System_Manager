/** The round-trip mileage saved for one calendar event, with the addresses it was calculated from. */
export interface EventMileage {
  eventId: string;
  baseAddress: string;
  location: string;
  /** Round-trip driving meters; null when OpenStreetMap could not find or route to the location. */
  distanceMeters: number | null;
}
