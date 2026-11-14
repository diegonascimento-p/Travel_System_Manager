import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { EventRepository } from "../src/repositories/EventRepository.js";
import { CalendarAccessError } from "../src/repositories/GoogleCalendarEventRepository.js";
import { FakeGeocoder, InMemoryEventRepository } from "./fakes.js";
import { migratedTripRepository } from "./tripDatabase.js";

const geocoder = new FakeGeocoder({ "Acme HQ": { latitude: 42 / 69.0941, longitude: 0 } });

function appWith(eventRepository: EventRepository) {
  return createApp({ eventRepository, geocoder, tripRepository: migratedTripRepository() });
}

describe("GET /api/events", () => {
  const repository = new InMemoryEventRepository([
    { id: "old", name: "Eve", date: "2023-12-31", location: "Acme HQ" },
    { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ" },
    { id: "b", name: "Workshop", date: "2024-06-01", location: null },
    { id: "c", name: "Review", date: "2024-09-20", location: "Acme HQ" },
    { id: "new", name: "New Year", date: "2025-01-01", location: "Acme HQ" },
  ]);

  it("returns every event of the year with its date, name and miles", async () => {
    const response = await request(appWith(repository))
      .get("/api/events")
      .query({ year: 2024, lat: 0, lng: 0 })
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.year).toBe(2024);
    expect(response.body.events.map((e: { id: string }) => e.id)).toEqual(["a", "b", "c"]);
    expect(response.body.events[0]).toMatchObject({ name: "Client visit - Acme", date: "2024-03-15" });
    expect(response.body.events[0].miles).toBeCloseTo(42, 1);
    expect(response.body.events[1].miles).toBeNull();
  });

  it("returns an empty list for a year without events", async () => {
    const response = await request(appWith(repository))
      .get("/api/events")
      .query({ year: 2022, lat: 0, lng: 0 })
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.events).toEqual([]);
  });

  it("requires a Google access token", async () => {
    const response = await request(appWith(repository)).get("/api/events").query({ year: 2024, lat: 0, lng: 0 });
    expect(response.status).toBe(401);
  });

  it.each([
    [{ year: 1899, lat: 0, lng: 0 }],
    [{ year: new Date().getFullYear() + 1, lat: 0, lng: 0 }],
    [{ year: "abc", lat: 0, lng: 0 }],
    [{ year: 2024, lng: 0 }],
    [{ year: 2024, lat: 91, lng: 0 }],
    [{ year: 2024, lat: 0, lng: 181 }],
  ])("rejects invalid query %o", async (query) => {
    const response = await request(appWith(repository))
      .get("/api/events")
      .query(query)
      .set("Authorization", "Bearer token");
    expect(response.status).toBe(400);
  });

  it("returns 401 when Google rejects the token", async () => {
    const denied: EventRepository = {
      findByDateRange: async () => {
        throw new CalendarAccessError("denied");
      },
    };
    const response = await request(appWith(denied))
      .get("/api/events")
      .query({ year: 2024, lat: 0, lng: 0 })
      .set("Authorization", "Bearer token");
    expect(response.status).toBe(401);
  });
});
