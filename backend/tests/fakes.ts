import type { CalendarEvent, Coordinates } from "../src/models/Event.js";
import type { EventRepository } from "../src/repositories/EventRepository.js";
import type { Geocoder } from "../src/services/Geocoder.js";

export class InMemoryEventRepository implements EventRepository {
  readonly calls: { accessToken: string; from: string; to: string }[] = [];

  constructor(private readonly events: CalendarEvent[]) {}

  async findByDateRange(accessToken: string, from: string, to: string): Promise<CalendarEvent[]> {
    this.calls.push({ accessToken, from, to });
    // Returns everything, like a repository that over-fetches around the range; the service must filter.
    return [...this.events];
  }
}

export class FakeGeocoder implements Geocoder {
  constructor(private readonly places: Record<string, Coordinates>) {}

  async geocode(address: string): Promise<Coordinates | null> {
    return this.places[address] ?? null;
  }
}
