import type { CalendarEvent, EventWithMiles } from "../models/Event.js";
import type { EventMileage } from "../models/EventMileage.js";
import type { EventMileageRepository } from "../repositories/EventMileageRepository.js";
import type { EventRepository } from "../repositories/EventRepository.js";
import { isInYear, yearBounds } from "./calendarYear.js";
import type { DistanceCalculator } from "./DistanceCalculator.js";
import { metersToMiles, roundTripMeters } from "./roundTrip.js";
import type { UserProfileService } from "./UserProfileService.js";

export interface EventsForYear {
  /** The base address the miles were measured from; null when the user has not saved one. */
  baseAddress: string | null;
  events: EventWithMiles[];
}

type LocatedEvent = CalendarEvent & { location: string };

export class EventMilesService {
  constructor(
    private readonly events: EventRepository,
    private readonly profiles: UserProfileService,
    private readonly distances: DistanceCalculator,
    private readonly mileages: EventMileageRepository,
  ) {}

  /**
   * Returns every event in the calendar year, oldest first, with the round-trip driving distance
   * between the user's saved base address and the event's location. Distances are calculated once
   * and saved with the event; they are recalculated when the base address or the location changes.
   */
  async getEventsForYear(accessToken: string, year: number): Promise<EventsForYear> {
    const { from, to } = yearBounds(year);
    const [events, { userId, profile }] = await Promise.all([
      this.events.findByDateRange(accessToken, from, to),
      this.profiles.getUserProfile(accessToken),
    ]);
    const inYear = events.filter((event) => isInYear(event.date, year)).sort(byDate);
    const meters = profile.baseAddress === null ? new Map() : await this.mileageFor(userId, profile.baseAddress, inYear);
    return {
      baseAddress: profile.baseAddress,
      events: inYear.map((event) => withDistance(event, meters.get(event.id) ?? null)),
    };
  }

  /** Round-trip meters per event id, from saved mileage or calculated and saved now. */
  private async mileageFor(userId: string, baseAddress: string, events: CalendarEvent[]): Promise<Map<string, number | null>> {
    const located = events.filter(hasLocation);
    const saved = await this.mileages.findByEventIds(userId, located.map((event) => event.id));
    const stale = located.filter((event) => !isCurrent(saved.get(event.id), baseAddress, event.location));
    const calculated = await this.calculate(baseAddress, stale);
    if (calculated.length > 0) await this.mileages.saveAll(userId, calculated);

    const current = located.filter((event) => !stale.includes(event)).map((event) => saved.get(event.id)!);
    return new Map([...current, ...calculated].map((m) => [m.eventId, m.distanceMeters]));
  }

  /**
   * Calculates the events' mileage. When Google Maps fails as a whole (quota, network) nothing is
   * returned, so those events show no mileage now and are calculated again on the next load.
   */
  private async calculate(baseAddress: string, events: LocatedEvent[]): Promise<EventMileage[]> {
    if (events.length === 0) return [];
    let roundTrips: Map<string, number>;
    try {
      roundTrips = await roundTripMeters(this.distances, baseAddress, [...new Set(events.map((e) => e.location))]);
    } catch (error) {
      console.error("Could not calculate event mileage", error);
      return [];
    }
    return events.map((event) => ({
      eventId: event.id,
      baseAddress,
      location: event.location,
      distanceMeters: roundTrips.get(event.location) ?? null,
    }));
  }
}

function hasLocation(event: CalendarEvent): event is LocatedEvent {
  return event.location !== null && event.location.trim() !== "";
}

function isCurrent(saved: EventMileage | undefined, baseAddress: string, location: string): boolean {
  return saved !== undefined && saved.baseAddress === baseAddress && saved.location === location;
}

function withDistance(event: CalendarEvent, meters: number | null): EventWithMiles {
  return {
    ...event,
    distanceMeters: meters,
    miles: meters === null ? null : metersToMiles(meters),
  };
}

function byDate(a: CalendarEvent, b: CalendarEvent): number {
  return a.date.localeCompare(b.date);
}
