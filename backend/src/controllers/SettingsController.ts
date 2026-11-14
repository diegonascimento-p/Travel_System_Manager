import type { NextFunction, Request, Response } from "express";
import { type SettingsService, SettingsValidationError } from "../services/SettingsService.js";

/** Translates HTTP requests to SettingsService calls and its results or errors to HTTP responses. */
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  get = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.getSettings());
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.saveSettings(req.body));
    } catch (error) {
      if (error instanceof SettingsValidationError) {
        res.status(400).json({ error: error.message, fields: error.fields });
      } else {
        next(error);
      }
    }
  };
}
