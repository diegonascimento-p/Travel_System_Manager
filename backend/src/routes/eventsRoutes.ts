import { Router } from "express";
import type { EventsController } from "../controllers/EventsController.js";

export function eventsRoutes(controller: EventsController): Router {
  const router = Router();
  router.get("/", controller.listByYear);
  return router;
}
