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

/** A calendar event with the miles traveled to reach its location. */
export interface EventWithMiles {
  id: string;
  name: string;
  date: string;
  location: string | null;
  /**
   * Driving miles from the user's base address to the event location; null when there is no base
   * address, the event has no location, or Google Maps cannot route between them.
   */
  miles: number | null;
}
