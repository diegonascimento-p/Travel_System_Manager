import express, { type NextFunction, type Request, type Response, Router } from "express";
import type { TripsController } from "../controllers/TripsController.js";

export function tripsRoutes(controller: TripsController): Router {
  const router = Router();
  router.use(express.json({ limit: "16kb" }));
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/summary", controller.summary);
  router.get("/:id", controller.get);
  router.put("/:id", controller.update);
  router.use(tripsErrorHandler);
  return router;
}

function tripsErrorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (isMalformedJson(error)) {
    res.status(400).json({ error: "The request body must be valid JSON", fields: {} });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Could not process the trip request" });
}

function isMalformedJson(error: unknown): boolean {
  return error instanceof SyntaxError && (error as { type?: string }).type === "entity.parse.failed";
}
