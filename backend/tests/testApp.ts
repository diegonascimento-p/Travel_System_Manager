import { createApp, type AppDependencies } from "../src/app.js";
import { SqliteEventMileageRepository } from "../src/repositories/SqliteEventMileageRepository.js";
import { SqliteUserProfileRepository } from "../src/repositories/SqliteUserProfileRepository.js";
import { FakeDistanceCalculator, FakeGeocoder, FakeUserIdentityRepository, InMemoryEventRepository } from "./fakes.js";
import { migratedDatabase } from "./tripDatabase.js";
import { SqliteTripRepository } from "../src/repositories/SqliteTripRepository.js";

/** The app on a fresh migrated database with fakes for Google; override any dependency. */
export function testApp(overrides: Partial<AppDependencies> = {}) {
  const db = migratedDatabase();
  return createApp({
    eventRepository: new InMemoryEventRepository([]),
    geocoder: new FakeGeocoder({}),
    distanceCalculator: new FakeDistanceCalculator({}),
    tripRepository: new SqliteTripRepository(db),
    userIdentityRepository: new FakeUserIdentityRepository(),
    userProfileRepository: new SqliteUserProfileRepository(db),
    eventMileageRepository: new SqliteEventMileageRepository(db),
    ...overrides,
  });
}
