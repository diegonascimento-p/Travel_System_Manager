import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { EventsController } from "./controllers/EventsController.js";
import { SettingsController } from "./controllers/SettingsController.js";
import { TripsController } from "./controllers/TripsController.js";
import type { EventRepository } from "./repositories/EventRepository.js";
import type { SettingsRepository } from "./repositories/SettingsRepository.js";
import type { TripRepository } from "./repositories/TripRepository.js";
import { EventMilesService } from "./services/EventMilesService.js";
import type { Geocoder } from "./services/Geocoder.js";
import { SettingsService } from "./services/SettingsService.js";
import { TripService } from "./services/TripService.js";
import { eventsRoutes } from "./routes/eventsRoutes.js";
import { settingsRoutes } from "./routes/settingsRoutes.js";
import { tripsRoutes } from "./routes/tripsRoutes.js";

export interface AppDependencies {
  eventRepository: EventRepository;
  geocoder: Geocoder;
  tripRepository: TripRepository;
  settingsRepository: SettingsRepository;
}

export function createApp({ eventRepository, geocoder, tripRepository, settingsRepository }: AppDependencies): Express {
  const app = express();
  const controller = new EventsController(new EventMilesService(eventRepository, geocoder));

  app.use("/api/trips", tripsRoutes(new TripsController(new TripService(tripRepository))));
  app.use("/api/settings", settingsRoutes(new SettingsController(new SettingsService(settingsRepository))));
  app.use("/api/events", eventsRoutes(controller));

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(502).json({ error: "Could not load events" });
  });

  return app;
}
