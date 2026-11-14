import type { CalendarEvent, Coordinates, EventWithMiles } from "../models/Event.js";
import type { EventRepository } from "../repositories/EventRepository.js";
import { isInYear, yearBounds } from "./calendarYear.js";
import { milesBetween } from "./distance.js";
import type { Geocoder } from "./Geocoder.js";

export class EventMilesService {
  constructor(
    private readonly events: EventRepository,
    private readonly geocoder: Geocoder,
  ) {}

  /**
   * Returns every event in the calendar year, oldest first, with the miles from
   * the user's current position to the event's location.
   */
  async getEventsForYear(
    accessToken: string,
    year: number,
    origin: Coordinates,
  ): Promise<EventWithMiles[]> {
    const { from, to } = yearBounds(year);
    const events = await this.events.findByDateRange(accessToken, from, to);
    const inYear = events.filter((event) => isInYear(event.date, year)).sort(byDate);
    return Promise.all(inYear.map((event) => this.withMiles(event, origin)));
  }

  private async withMiles(event: CalendarEvent, origin: Coordinates): Promise<EventWithMiles> {
    const destination = event.location ? await this.geocoder.geocode(event.location) : null;
    return {
      ...event,
      miles: destination ? milesBetween(origin, destination) : null,
    };
  }
}

function byDate(a: CalendarEvent, b: CalendarEvent): number {
  return a.date.localeCompare(b.date);
}
