import type { NextFunction, Request, Response } from "express";
import { CalendarAccessError } from "../repositories/GoogleCalendarEventRepository.js";
import { type UserProfileService, UserProfileValidationError } from "../services/UserProfileService.js";
import { bearerToken } from "./bearerToken.js";

/** Translates settings requests to UserProfileService calls and its results or errors to HTTP responses. */
export class SettingsController {
  constructor(private readonly service: UserProfileService) {}

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await respond(req, res, next, (accessToken) => this.service.getProfile(accessToken));
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await respond(req, res, next, (accessToken) => this.service.updateProfile(accessToken, req.body));
  };
}

async function respond(
  req: Request,
  res: Response,
  next: NextFunction,
  action: (accessToken: string) => Promise<unknown>,
): Promise<void> {
  const accessToken = bearerToken(req);
  if (!accessToken) {
    res.status(401).json({ error: "Missing Google access token" });
    return;
  }
  try {
    res.json(await action(accessToken));
  } catch (error) {
    if (error instanceof UserProfileValidationError) {
      res.status(400).json({ error: error.message, fields: error.fields });
    } else if (error instanceof CalendarAccessError) {
      res.status(401).json({ error: error.message });
    } else {
      next(error);
    }
  }
}
