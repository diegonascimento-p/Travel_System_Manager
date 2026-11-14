import type { CalendarEvent, EventWithMiles } from "../models/Event.js";
import type { EventRepository } from "../repositories/EventRepository.js";
import { isInYear, yearBounds } from "./calendarYear.js";
import type { DistanceCalculator } from "./DistanceCalculator.js";
import type { UserProfileService } from "./UserProfileService.js";

export interface EventsForYear {
  /** The base address the miles were measured from; null when the user has not saved one. */
  baseAddress: string | null;
  events: EventWithMiles[];
}

export class EventMilesService {
  constructor(
    private readonly events: EventRepository,
    private readonly profiles: UserProfileService,
    private readonly distances: DistanceCalculator,
  ) {}

  /**
   * Returns every event in the calendar year, oldest first, with the driving miles from the
   * user's saved base address to the event's location.
   */
  async getEventsForYear(accessToken: string, year: number): Promise<EventsForYear> {
    const { from, to } = yearBounds(year);
    const [events, profile] = await Promise.all([
      this.events.findByDateRange(accessToken, from, to),
      this.profiles.getProfile(accessToken),
    ]);
    const inYear = events.filter((event) => isInYear(event.date, year)).sort(byDate);
    const miles = await this.milesFromBase(profile.baseAddress, inYear);
    return {
      baseAddress: profile.baseAddress,
      events: inYear.map((event) => ({ ...event, miles: milesTo(event, miles) })),
    };
  }

  private async milesFromBase(baseAddress: string | null, events: CalendarEvent[]): Promise<Map<string, number>> {
    const locations = events.flatMap((event) => (event.location ? [event.location] : []));
    if (baseAddress === null || locations.length === 0) return new Map();
    return this.distances.milesFrom(baseAddress, locations);
  }
}

function milesTo(event: CalendarEvent, miles: Map<string, number>): number | null {
  return event.location ? (miles.get(event.location) ?? null) : null;
}

function byDate(a: CalendarEvent, b: CalendarEvent): number {
  return a.date.localeCompare(b.date);
}
