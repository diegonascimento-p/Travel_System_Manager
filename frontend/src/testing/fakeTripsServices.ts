import type { Trip, TripInput } from "../models/trip";
import type { TripsServices } from "../services/tripsApi";

/** TripsServices keeping trips in memory, newest first like the API; every method is a spy. */
export function fakeTripsServices(initial: Trip[] = []) {
  const trips = [...initial];
  let nextId = Math.max(0, ...trips.map((t) => t.id)) + 1;
  const sorted = () => [...trips].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const services = {
    trips,
    fetchTrips: vi.fn(async (limit: number, offset: number) => ({
      trips: sorted().slice(offset, offset + limit),
      total: trips.length,
      limit,
      offset,
    })),
    fetchTrip: vi.fn(async (id: number) => {
      const trip = trips.find((t) => t.id === id);
      if (!trip) throw new Error("The trip was not found.");
      return trip;
    }),
    createTrip: vi.fn(async (input: TripInput) => {
      const trip = { id: nextId++, ...input };
      trips.push(trip);
      return trip;
    }),
    updateTrip: vi.fn(async (id: number, input: TripInput) => {
      const index = trips.findIndex((t) => t.id === id);
      trips[index] = { id, ...input };
      return trips[index];
    }),
    fetchMonthlyMileage: vi.fn(async (month: string) => {
      const inMonth = trips.filter((t) => t.date.startsWith(`${month}-`));
      return { month, totalDistance: inMonth.reduce((sum, t) => sum + t.distance, 0), tripCount: inMonth.length };
    }),
  } satisfies TripsServices & { trips: Trip[] };
  return services;
}

export const trip = (id: number, date: string, overrides: Partial<Trip> = {}): Trip => ({
  id,
  date,
  origin: `Origin ${id}`,
  destination: `Destination ${id}`,
  distance: 10,
  purpose: `Purpose ${id}`,
  ...overrides,
});
