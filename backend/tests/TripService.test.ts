import { describe, expect, it } from "vitest";
import { TripNotFoundError, TripService, TripValidationError } from "../src/services/TripService.js";
import { migratedTripRepository } from "./tripDatabase.js";

const trip = (date: string, distance: number, purpose = "Visit") => ({
  date,
  origin: "Office",
  destination: "Client",
  distance,
  purpose,
});

async function serviceWith(trips: ReturnType<typeof trip>[]) {
  const service = new TripService(migratedTripRepository());
  for (const t of trips) await service.createTrip(t);
  return service;
}

describe("TripService.getMonthlyMileage", () => {
  it("sums the distances of the month's trips only", async () => {
    const service = await serviceWith([
      trip("2026-10-31", 100),
      trip("2026-11-01", 10.1),
      trip("2026-11-14", 20.2),
      trip("2026-11-30", 0.3),
      trip("2026-12-01", 1000),
    ]);

    await expect(service.getMonthlyMileage("2026-11")).resolves.toEqual({
      month: "2026-11",
      totalDistance: 30.6,
      tripCount: 3,
    });
  });

  it("returns zero for a month without trips", async () => {
    const service = await serviceWith([trip("2026-10-31", 100)]);
    await expect(service.getMonthlyMileage("2026-11")).resolves.toEqual({
      month: "2026-11",
      totalDistance: 0,
      tripCount: 0,
    });
  });

  it("rejects an invalid month", async () => {
    const service = await serviceWith([]);
    await expect(service.getMonthlyMileage("November")).rejects.toBeInstanceOf(TripValidationError);
  });
});

describe("TripService.listTrips", () => {
  it("lists trips newest first, latest created first within a day", async () => {
    const service = await serviceWith([
      trip("2026-09-01", 1, "a"),
      trip("2026-11-02", 1, "b"),
      trip("2026-10-15", 1, "c"),
      trip("2026-11-02", 1, "d"),
    ]);

    const page = await service.listTrips();

    expect(page.trips.map((t) => t.purpose)).toEqual(["d", "b", "c", "a"]);
    expect(page).toMatchObject({ total: 4, limit: 20, offset: 0 });
  });

  it("returns the requested page", async () => {
    const service = await serviceWith([trip("2026-01-01", 1, "a"), trip("2026-01-02", 1, "b"), trip("2026-01-03", 1, "c")]);

    const page = await service.listTrips(2, 2);

    expect(page.trips.map((t) => t.purpose)).toEqual(["a"]);
    expect(page.total).toBe(3);
  });

  it("rejects invalid paging", async () => {
    const service = await serviceWith([]);
    await expect(service.listTrips(0)).rejects.toBeInstanceOf(TripValidationError);
  });
});

describe("TripService create and update", () => {
  it("creates a trip and reads it back", async () => {
    const service = await serviceWith([]);
    const created = await service.createTrip(trip("2026-11-03", 12.5));
    await expect(service.getTrip(created.id)).resolves.toEqual({ id: created.id, ...trip("2026-11-03", 12.5) });
  });

  it("reports every invalid field and saves nothing", async () => {
    const service = await serviceWith([]);
    const error = await service.createTrip({ ...trip("2026-11-03", 1), origin: "", distance: "far" }).catch((e) => e);

    expect(error).toBeInstanceOf(TripValidationError);
    expect(Object.keys(error.fields)).toEqual(["origin", "distance"]);
    expect((await service.listTrips()).total).toBe(0);
  });

  it("updates every field of an existing trip", async () => {
    const service = await serviceWith([trip("2026-11-03", 12.5)]);
    const [{ id }] = (await service.listTrips()).trips;
    const changes = { date: "2026-11-04", origin: "Home", destination: "Depot", distance: 7, purpose: "Pickup" };

    await expect(service.updateTrip(id, changes)).resolves.toEqual({ id, ...changes });
    await expect(service.getTrip(id)).resolves.toEqual({ id, ...changes });
  });

  it("reports a missing trip", async () => {
    const service = await serviceWith([]);
    await expect(service.getTrip(99)).rejects.toBeInstanceOf(TripNotFoundError);
    await expect(service.updateTrip(99, trip("2026-11-03", 1))).rejects.toBeInstanceOf(TripNotFoundError);
  });
});
