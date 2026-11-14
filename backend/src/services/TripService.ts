import type { MonthlyMileage, Trip, TripPage } from "../models/Trip.js";
import type { TripRepository } from "../repositories/TripRepository.js";
import { type FieldErrors, monthBounds, pageParams, roundDistance, validateTripInput } from "./tripRules.js";

/** The request was invalid; `fields` holds a message per invalid trip field, when relevant. */
export class TripValidationError extends Error {
  constructor(
    message: string,
    readonly fields: FieldErrors = {},
  ) {
    super(message);
  }
}

export class TripNotFoundError extends Error {
  constructor(id: number) {
    super(`Trip ${id} was not found`);
  }
}

export class TripService {
  constructor(private readonly trips: TripRepository) {}

  /** Returns a page of trips, newest first. */
  async listTrips(limit?: number, offset?: number): Promise<TripPage & { limit: number; offset: number }> {
    const page = pageParams(limit, offset);
    if (!page) throw new TripValidationError("limit must be 1-100 and offset a non-negative integer");
    const result = await this.trips.list(page.limit, page.offset);
    return { ...result, ...page };
  }

  async getTrip(id: number): Promise<Trip> {
    const trip = await this.trips.findById(id);
    if (!trip) throw new TripNotFoundError(id);
    return trip;
  }

  async createTrip(raw: unknown): Promise<Trip> {
    return this.trips.create(validTrip(raw));
  }

  async updateTrip(id: number, raw: unknown): Promise<Trip> {
    const trip = await this.trips.update(id, validTrip(raw));
    if (!trip) throw new TripNotFoundError(id);
    return trip;
  }

  /** Total miles of the trips dated in a YYYY-MM month. */
  async getMonthlyMileage(month: string): Promise<MonthlyMileage> {
    const bounds = monthBounds(month);
    if (!bounds) throw new TripValidationError("month must be formatted YYYY-MM");
    const { totalDistance, tripCount } = await this.trips.summarizeBetween(bounds.from, bounds.to);
    return { month, totalDistance: roundDistance(totalDistance), tripCount };
  }
}

function validTrip(raw: unknown) {
  const result = validateTripInput(raw);
  if (!result.ok) throw new TripValidationError("The trip is invalid", result.errors);
  return result.value;
}
