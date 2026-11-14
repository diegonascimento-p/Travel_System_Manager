import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { TripRepository } from "../src/repositories/TripRepository.js";
import { FakeGeocoder, InMemoryEventRepository } from "./fakes.js";
import { migratedTripRepository } from "./tripDatabase.js";

const trip = {
  date: "2026-11-03",
  origin: "Office",
  destination: "Acme HQ",
  distance: 42.5,
  purpose: "Client visit",
};

function appWith(tripRepository: TripRepository = migratedTripRepository()) {
  return createApp({
    eventRepository: new InMemoryEventRepository([]),
    geocoder: new FakeGeocoder({}),
    tripRepository,
  });
}

describe("POST /api/trips", () => {
  it("creates a trip and returns it with its id", async () => {
    const app = appWith();

    const response = await request(app).post("/api/trips").send(trip);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: expect.any(Number), ...trip });
    const list = await request(app).get("/api/trips");
    expect(list.body.trips).toEqual([response.body]);
  });

  it("rejects missing fields and a non-numeric distance without saving", async () => {
    const app = appWith();

    const response = await request(app)
      .post("/api/trips")
      .send({ ...trip, origin: "", purpose: undefined, distance: "ten" });

    expect(response.status).toBe(400);
    expect(response.body.fields).toEqual({
      origin: "Origin is required.",
      distance: "Distance must be a number.",
      purpose: "Purpose is required.",
    });
    expect((await request(app).get("/api/trips")).body.total).toBe(0);
  });

  it("rejects a malformed JSON body", async () => {
    const response = await request(appWith())
      .post("/api/trips")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(response.status).toBe(400);
  });
});

describe("GET /api/trips", () => {
  it("lists trips newest first with every field, paginated", async () => {
    const app = appWith();
    for (const date of ["2026-09-01", "2026-11-02", "2026-10-15"]) {
      await request(app).post("/api/trips").send({ ...trip, date });
    }

    const first = await request(app).get("/api/trips").query({ limit: 2 });
    const second = await request(app).get("/api/trips").query({ limit: 2, offset: 2 });

    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ total: 3, limit: 2, offset: 0 });
    expect(first.body.trips.map((t: { date: string }) => t.date)).toEqual(["2026-11-02", "2026-10-15"]);
    expect(first.body.trips[0]).toMatchObject({ origin: "Office", destination: "Acme HQ", distance: 42.5, purpose: "Client visit" });
    expect(second.body.trips.map((t: { date: string }) => t.date)).toEqual(["2026-09-01"]);
  });

  it.each([[{ limit: 0 }], [{ limit: 500 }], [{ offset: -1 }], [{ limit: "abc" }]])(
    "rejects invalid paging %o",
    async (query) => {
      const response = await request(appWith()).get("/api/trips").query(query);
      expect(response.status).toBe(400);
    },
  );
});

describe("GET /api/trips/:id", () => {
  it("returns one trip", async () => {
    const app = appWith();
    const { body: created } = await request(app).post("/api/trips").send(trip);

    const response = await request(app).get(`/api/trips/${created.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(created);
  });

  it.each([["999"], ["abc"]])("returns 404 for the unknown id %s", async (id) => {
    const response = await request(appWith()).get(`/api/trips/${id}`);
    expect(response.status).toBe(404);
  });
});

describe("PUT /api/trips/:id", () => {
  it("saves every changed field", async () => {
    const app = appWith();
    const { body: created } = await request(app).post("/api/trips").send(trip);
    const changes = { date: "2026-11-05", origin: "Home", destination: "Depot", distance: 7, purpose: "Pickup" };

    const response = await request(app).put(`/api/trips/${created.id}`).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: created.id, ...changes });
    expect((await request(app).get("/api/trips")).body.trips).toEqual([{ id: created.id, ...changes }]);
  });

  it("rejects invalid changes and keeps the trip as it was", async () => {
    const app = appWith();
    const { body: created } = await request(app).post("/api/trips").send(trip);

    const response = await request(app).put(`/api/trips/${created.id}`).send({ ...trip, distance: -1 });

    expect(response.status).toBe(400);
    expect(response.body.fields).toEqual({ distance: "Distance must be greater than zero." });
    expect((await request(app).get(`/api/trips/${created.id}`)).body).toEqual(created);
  });

  it("returns 404 for an unknown trip", async () => {
    const response = await request(appWith()).put("/api/trips/999").send(trip);
    expect(response.status).toBe(404);
  });
});

describe("GET /api/trips/summary", () => {
  it("totals the miles of the requested month only", async () => {
    const app = appWith();
    for (const [date, distance] of [["2026-10-31", 100], ["2026-11-01", 10], ["2026-11-30", 5.5], ["2026-12-01", 7]] as const) {
      await request(app).post("/api/trips").send({ ...trip, date, distance });
    }

    const response = await request(app).get("/api/trips/summary").query({ month: "2026-11" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ month: "2026-11", totalDistance: 15.5, tripCount: 2 });
  });

  it("returns zero for a month without trips", async () => {
    const response = await request(appWith()).get("/api/trips/summary").query({ month: "2026-11" });
    expect(response.body).toEqual({ month: "2026-11", totalDistance: 0, tripCount: 0 });
  });

  it("rejects a missing or invalid month", async () => {
    expect((await request(appWith()).get("/api/trips/summary")).status).toBe(400);
    expect((await request(appWith()).get("/api/trips/summary").query({ month: "2026-13" })).status).toBe(400);
  });
});

describe("trip storage failures", () => {
  it("answers 500 instead of crashing", async () => {
    const failing = migratedTripRepository();
    failing.list = async () => {
      throw new Error("disk full");
    };
    const response = await request(appWith(failing)).get("/api/trips");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Could not process the trip request" });
  });
});
