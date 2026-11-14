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
  /** Miles from the user's current position to the event location; null when the location is unknown. */
  miles: number | null;
}
