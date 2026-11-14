import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { EventsController } from "./controllers/EventsController.js";
import { SettingsController } from "./controllers/SettingsController.js";
import { TripsController } from "./controllers/TripsController.js";
import type { EventRepository } from "./repositories/EventRepository.js";
import type { TripRepository } from "./repositories/TripRepository.js";
import type { UserIdentityRepository } from "./repositories/UserIdentityRepository.js";
import type { UserProfileRepository } from "./repositories/UserProfileRepository.js";
import type { DistanceCalculator } from "./services/DistanceCalculator.js";
import { EventMilesService } from "./services/EventMilesService.js";
import type { Geocoder } from "./services/Geocoder.js";
import { TripService } from "./services/TripService.js";
import { UserProfileService } from "./services/UserProfileService.js";
import { eventsRoutes } from "./routes/eventsRoutes.js";
import { settingsRoutes } from "./routes/settingsRoutes.js";
import { tripsRoutes } from "./routes/tripsRoutes.js";

export interface AppDependencies {
  eventRepository: EventRepository;
  geocoder: Geocoder;
  distanceCalculator: DistanceCalculator;
  tripRepository: TripRepository;
  userIdentityRepository: UserIdentityRepository;
  userProfileRepository: UserProfileRepository;
}

export function createApp(deps: AppDependencies): Express {
  const app = express();
  const profiles = new UserProfileService(deps.userIdentityRepository, deps.userProfileRepository, deps.geocoder);
  const events = new EventMilesService(deps.eventRepository, profiles, deps.distanceCalculator);

  app.use("/api/trips", tripsRoutes(new TripsController(new TripService(deps.tripRepository))));
  app.use("/api/settings", settingsRoutes(new SettingsController(profiles)));
  app.use("/api/events", eventsRoutes(new EventsController(events)));

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(502).json({ error: "Could not load events" });
  });

  return app;
}
