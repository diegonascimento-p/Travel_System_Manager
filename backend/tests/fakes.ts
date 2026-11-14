import type { CalendarEvent, Coordinates } from "../src/models/Event.js";
import type { EventRepository } from "../src/repositories/EventRepository.js";
import type { EventMileage } from "../src/models/EventMileage.js";
import type { EventMileageRepository } from "../src/repositories/EventMileageRepository.js";
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

/** Driving meters keyed by `origin -> destination`; unknown pairs cannot be routed. */
export class FakeDistanceCalculator implements DistanceCalculator {
  readonly calls: { origins: string[]; destinations: string[] }[] = [];
  failure: Error | null = null;

  constructor(private readonly meters: Record<string, number>) {}

  async metersFrom(origin: string, destinations: string[]): Promise<Map<string, number>> {
    return this.lookup([origin], destinations, (destination) => `${origin} -> ${destination}`, destinations);
  }

  async metersTo(origins: string[], destination: string): Promise<Map<string, number>> {
    return this.lookup(origins, [destination], (origin) => `${origin} -> ${destination}`, origins);
  }

  private async lookup(
    origins: string[],
    destinations: string[],
    pair: (address: string) => string,
    addresses: string[],
  ): Promise<Map<string, number>> {
    this.calls.push({ origins, destinations });
    if (this.failure) throw this.failure;
    const result = new Map<string, number>();
    for (const address of addresses) {
      const meters = this.meters[pair(address)];
      if (meters !== undefined) result.set(address, meters);
    }
    return result;
  }
}

/** Same distance both ways for each `[from, to, meters]`, keyed as FakeDistanceCalculator expects. */
export function symmetric(...legs: [string, string, number][]): Record<string, number> {
  return Object.fromEntries(legs.flatMap(([a, b, meters]) => [[`${a} -> ${b}`, meters], [`${b} -> ${a}`, meters]]));
}

export class InMemoryEventMileageRepository implements EventMileageRepository {
  readonly saved = new Map<string, EventMileage>();

  async findByEventIds(userId: string, eventIds: string[]): Promise<Map<string, EventMileage>> {
    const found = new Map<string, EventMileage>();
    for (const id of eventIds) {
      const mileage = this.saved.get(`${userId}/${id}`);
      if (mileage) found.set(id, { ...mileage });
    }
    return found;
  }

  async saveAll(userId: string, mileages: EventMileage[]): Promise<void> {
    for (const mileage of mileages) this.saved.set(`${userId}/${mileage.eventId}`, { ...mileage });
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
