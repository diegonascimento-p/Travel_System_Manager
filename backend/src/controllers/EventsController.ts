import type { Request, Response, NextFunction } from "express";
import { CalendarAccessError } from "../repositories/GoogleCalendarEventRepository.js";
import { isSupportedYear } from "../services/calendarYear.js";
import type { EventMilesService } from "../services/EventMilesService.js";
import { bearerToken } from "./bearerToken.js";

export class EventsController {
  constructor(private readonly service: EventMilesService) {}

  listByYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const accessToken = bearerToken(req);
    if (!accessToken) {
      res.status(401).json({ error: "Missing Google access token" });
      return;
    }

    const year = Number(req.query.year);
    if (!isSupportedYear(year)) {
      res.status(400).json({ error: "year must be between 1900 and the current year" });
      return;
    }

    try {
      const { baseAddress, events } = await this.service.getEventsForYear(accessToken, year);
      res.json({ year, baseAddress, events });
    } catch (error) {
      if (error instanceof CalendarAccessError) {
        res.status(401).json({ error: error.message });
        return;
      }
      next(error);
    }
  };
}
