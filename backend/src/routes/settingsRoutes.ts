import express, { type NextFunction, type Request, type Response, Router } from "express";
import type { SettingsController } from "../controllers/SettingsController.js";

export function settingsRoutes(controller: SettingsController): Router {
  const router = Router();
  router.use(express.json({ limit: "4kb" }));
  router.get("/", controller.get);
  router.put("/", controller.update);
  router.use(settingsErrorHandler);
  return router;
}

function settingsErrorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof SyntaxError && (error as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: "The request body must be valid JSON", fields: {} });
    return;
  }
  console.error(error);
  res.status(502).json({ error: "Could not process the settings request" });
}
