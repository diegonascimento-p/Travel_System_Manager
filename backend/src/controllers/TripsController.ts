import type { NextFunction, Request, Response } from "express";
import { TripNotFoundError, type TripService, TripValidationError } from "../services/TripService.js";

/** Translates HTTP requests to TripService calls and its results or errors to HTTP responses. */
export class TripsController {
  constructor(private readonly service: TripService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const limit = optionalNumber(req.query.limit);
    const offset = optionalNumber(req.query.offset);
    await respond(res, next, () => this.service.listTrips(limit, offset));
  };

  summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await respond(res, next, () => this.service.getMonthlyMileage(String(req.query.month ?? "")));
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await respond(res, next, () => this.service.getTrip(tripId(req)));
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await respond(res, next, () => this.service.createTrip(req.body), 201);
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await respond(res, next, () => this.service.updateTrip(tripId(req), req.body));
  };
}

async function respond(res: Response, next: NextFunction, action: () => Promise<unknown>, status = 200) {
  try {
    res.status(status).json(await action());
  } catch (error) {
    if (error instanceof TripValidationError) {
      res.status(400).json({ error: error.message, fields: error.fields });
    } else if (error instanceof TripNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
}

/** The numeric id from the URL; anything else cannot match a trip, so it is reported as not found. */
function tripId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) throw new TripNotFoundError(NaN);
  return id;
}

function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === "" ? undefined : Number(value);
}
