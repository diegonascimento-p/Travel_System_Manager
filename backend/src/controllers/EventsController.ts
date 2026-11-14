import type { Request, Response, NextFunction } from "express";
import { CalendarAccessError } from "../repositories/GoogleCalendarEventRepository.js";
import { isSupportedYear } from "../services/calendarYear.js";
import type { EventMilesService } from "../services/EventMilesService.js";

export class EventsController {
  constructor(private readonly service: EventMilesService) {}

  listByYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const accessToken = bearerToken(req.header("authorization"));
    if (!accessToken) {
      res.status(401).json({ error: "Missing Google access token" });
      return;
    }

    const year = Number(req.query.year);
    if (!isSupportedYear(year)) {
      res.status(400).json({ error: "year must be between 1900 and the current year" });
      return;
    }

    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lng);
    if (!isLatitude(req.query.lat, latitude) || !isLongitude(req.query.lng, longitude)) {
      res.status(400).json({ error: "lat and lng must be valid coordinates" });
      return;
    }

    try {
      const events = await this.service.getEventsForYear(accessToken, year, { latitude, longitude });
      res.json({ year, events });
    } catch (error) {
      if (error instanceof CalendarAccessError) {
        res.status(401).json({ error: error.message });
        return;
      }
      next(error);
    }
  };
}

function bearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

function isLatitude(raw: unknown, value: number): boolean {
  return typeof raw === "string" && raw !== "" && Number.isFinite(value) && Math.abs(value) <= 90;
}

function isLongitude(raw: unknown, value: number): boolean {
  return typeof raw === "string" && raw !== "" && Number.isFinite(value) && Math.abs(value) <= 180;
}
