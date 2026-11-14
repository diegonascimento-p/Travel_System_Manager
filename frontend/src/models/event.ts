/** An event with the round-trip driving distance between the user's base address and its location. */
export interface EventWithMiles {
  id: string;
  name: string;
  /** Local date of the event, YYYY-MM-DD. */
  date: string;
  location: string | null;
  /**
   * Round-trip driving meters (base address to location and back). Null without a base address,
   * or when the event has no location OpenStreetMap can find or route to.
   */
  distanceMeters: number | null;
  /** `distanceMeters` in miles; null when unknown. */
  miles: number | null;
}

/** A calendar year's events and the base address their miles were measured from. */
export interface YearEvents {
  /** Null when the user has not saved a base address yet. */
  baseAddress: string | null;
  events: EventWithMiles[];
}
