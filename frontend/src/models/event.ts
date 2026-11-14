/** An event with the driving miles from the user's base address to its location. */
export interface EventWithMiles {
  id: string;
  name: string;
  /** Local date of the event, YYYY-MM-DD. */
  date: string;
  location: string | null;
  /** Null without a base address, or when the event has no location Google Maps can route to. */
  miles: number | null;
}

/** A calendar year's events and the base address their miles were measured from. */
export interface YearEvents {
  /** Null when the user has not saved a base address yet. */
  baseAddress: string | null;
  events: EventWithMiles[];
}
