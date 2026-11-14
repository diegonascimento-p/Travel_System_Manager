import { createApp } from "./app.js";
import { openDatabase } from "./db/database.js";
import { runMigrations } from "./db/migrate.js";
import { GoogleCalendarEventRepository } from "./repositories/GoogleCalendarEventRepository.js";
import { GoogleCalendarUserIdentityRepository } from "./repositories/GoogleCalendarUserIdentityRepository.js";
import { SqliteEventMileageRepository } from "./repositories/SqliteEventMileageRepository.js";
import { SqliteTripRepository } from "./repositories/SqliteTripRepository.js";
import { SqliteUserProfileRepository } from "./repositories/SqliteUserProfileRepository.js";
import { createMapServices } from "./services/mapServices.js";

const port = Number(process.env.PORT ?? 3001);
const db = openDatabase(process.env.DATABASE_PATH ?? "data/travel.db");
const applied = runMigrations(db);
if (applied.length > 0) console.log(`Applied migrations: ${applied.join(", ")}`);

const { geocoder, distanceCalculator } = createMapServices(process.env);
const app = createApp({
  eventRepository: new GoogleCalendarEventRepository(),
  geocoder,
  distanceCalculator,
  tripRepository: new SqliteTripRepository(db),
  userIdentityRepository: new GoogleCalendarUserIdentityRepository(),
  userProfileRepository: new SqliteUserProfileRepository(db),
  eventMileageRepository: new SqliteEventMileageRepository(db),
});

app.listen(port, () => {
  console.log(`Travel System Manager API listening on port ${port}`);
});
