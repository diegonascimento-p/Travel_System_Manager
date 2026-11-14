import { createApp } from "./app.js";
import { openDatabase } from "./db/database.js";
import { runMigrations } from "./db/migrate.js";
import { GoogleCalendarEventRepository } from "./repositories/GoogleCalendarEventRepository.js";
import { GoogleCalendarUserIdentityRepository } from "./repositories/GoogleCalendarUserIdentityRepository.js";
import { SqliteEventMileageRepository } from "./repositories/SqliteEventMileageRepository.js";
import { SqliteTripRepository } from "./repositories/SqliteTripRepository.js";
import { SqliteUserProfileRepository } from "./repositories/SqliteUserProfileRepository.js";
import { GoogleDistanceMatrix } from "./services/GoogleDistanceMatrix.js";
import { GoogleGeocoder } from "./services/GoogleGeocoder.js";

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_MAPS_API_KEY must be set");
}

const port = Number(process.env.PORT ?? 3001);
const db = openDatabase(process.env.DATABASE_PATH ?? "data/travel.db");
const applied = runMigrations(db);
if (applied.length > 0) console.log(`Applied migrations: ${applied.join(", ")}`);

const app = createApp({
  eventRepository: new GoogleCalendarEventRepository(),
  geocoder: new GoogleGeocoder(apiKey),
  distanceCalculator: new GoogleDistanceMatrix(apiKey),
  tripRepository: new SqliteTripRepository(db),
  userIdentityRepository: new GoogleCalendarUserIdentityRepository(),
  userProfileRepository: new SqliteUserProfileRepository(db),
  eventMileageRepository: new SqliteEventMileageRepository(db),
});

app.listen(port, () => {
  console.log(`Travel System Manager API listening on port ${port}`);
});
