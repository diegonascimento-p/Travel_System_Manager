import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { EventsController } from "./controllers/EventsController.js";
import type { EventRepository } from "./repositories/EventRepository.js";
import { EventMilesService } from "./services/EventMilesService.js";
import type { Geocoder } from "./services/Geocoder.js";
import { eventsRoutes } from "./routes/eventsRoutes.js";

export interface AppDependencies {
  eventRepository: EventRepository;
  geocoder: Geocoder;
}

export function createApp({ eventRepository, geocoder }: AppDependencies): Express {
  const app = express();
  const controller = new EventsController(new EventMilesService(eventRepository, geocoder));

  app.use("/api/events", eventsRoutes(controller));

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(502).json({ error: "Could not load events" });
  });

  return app;
}
