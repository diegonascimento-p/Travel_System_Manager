import type { Trip, TripInput, TripPage } from "../models/Trip.js";

export interface TripRepository {
  /** Returns a page of trips, newest trip date first (latest created first within a day). */
  list(limit: number, offset: number): Promise<TripPage>;
  findById(id: number): Promise<Trip | null>;
  create(input: TripInput): Promise<Trip>;
  /** Replaces the trip's fields; returns null when no trip has the id. */
  update(id: number, input: TripInput): Promise<Trip | null>;
  /** Sum of distances and number of trips dated between the two dates (inclusive, YYYY-MM-DD). */
  summarizeBetween(from: string, to: string): Promise<{ totalDistance: number; tripCount: number }>;
}
