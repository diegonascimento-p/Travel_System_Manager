import type { CalendarEvent, Coordinates } from "../src/models/Event.js";
import type { EventRepository } from "../src/repositories/EventRepository.js";
import type { UserProfile } from "../src/models/UserProfile.js";
import type { UserIdentityRepository } from "../src/repositories/UserIdentityRepository.js";
import type { UserProfileRepository } from "../src/repositories/UserProfileRepository.js";
import type { DistanceCalculator } from "../src/services/DistanceCalculator.js";
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

/** Driving miles keyed by `origin -> destination`; unknown pairs cannot be routed. */
export class FakeDistanceCalculator implements DistanceCalculator {
  readonly calls: { origin: string; destinations: string[] }[] = [];

  constructor(private readonly miles: Record<string, number>) {}

  async milesFrom(origin: string, destinations: string[]): Promise<Map<string, number>> {
    this.calls.push({ origin, destinations });
    const result = new Map<string, number>();
    for (const destination of destinations) {
      const miles = this.miles[`${origin} -> ${destination}`];
      if (miles !== undefined) result.set(destination, miles);
    }
    return result;
  }
}

/** Maps access tokens to user ids; any other token belongs to "user@example.com". */
export class FakeUserIdentityRepository implements UserIdentityRepository {
  constructor(private readonly users: Record<string, string> = {}) {}

  async findUserId(accessToken: string): Promise<string> {
    return this.users[accessToken] ?? "user@example.com";
  }
}

export class InMemoryUserProfileRepository implements UserProfileRepository {
  readonly profiles = new Map<string, UserProfile>();

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async save(userId: string, profile: UserProfile): Promise<UserProfile> {
    this.profiles.set(userId, { ...profile });
    return { ...profile };
  }
}
