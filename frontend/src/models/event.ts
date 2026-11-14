export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** An event with the miles traveled from the user's current position to its location. */
export interface EventWithMiles {
  id: string;
  name: string;
  /** Local date of the event, YYYY-MM-DD. */
  date: string;
  location: string | null;
  /** Null when the event has no location that could be found. */
  miles: number | null;
}
