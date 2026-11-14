/** A point on the map, as returned by geocoding. */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** A calendar event as read from the user's calendar. */
export interface CalendarEvent {
  id: string;
  name: string;
  /** Local start date of the event in the calendar, formatted YYYY-MM-DD. */
  date: string;
  /** Free-text location (destination) of the event, if any. */
  location: string | null;
}

/** A calendar event with the round-trip distance traveled to reach its location and come back. */
export interface EventWithMiles {
  id: string;
  name: string;
  date: string;
  location: string | null;
  /**
   * Round-trip driving meters: base address to the event location plus the location back to the
   * base address. Null when there is no base address, the event has no location, or OpenStreetMap
   * cannot find or route to it.
   */
  distanceMeters: number | null;
  /** `distanceMeters` in miles; null when `distanceMeters` is null. */
  miles: number | null;
}
