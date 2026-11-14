import request from "supertest";
import { describe, expect, it } from "vitest";
import type { EventRepository } from "../src/repositories/EventRepository.js";
import { CalendarAccessError } from "../src/repositories/GoogleCalendarEventRepository.js";
import { FakeDistanceCalculator, FakeGeocoder, InMemoryEventRepository, InMemoryUserProfileRepository } from "./fakes.js";
import { testApp } from "./testApp.js";

function appWith(eventRepository: EventRepository, baseAddress: string | null = "Home") {
  const userProfileRepository = new InMemoryUserProfileRepository();
  if (baseAddress) userProfileRepository.profiles.set("user@example.com", { baseAddress });
  return testApp({
    eventRepository,
    userProfileRepository,
    distanceCalculator: new FakeDistanceCalculator({ "Home -> Acme HQ": 42 }),
  });
}

describe("GET /api/events", () => {
  const repository = new InMemoryEventRepository([
    { id: "old", name: "Eve", date: "2023-12-31", location: "Acme HQ" },
    { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ" },
    { id: "b", name: "Workshop", date: "2024-06-01", location: null },
    { id: "c", name: "Review", date: "2024-09-20", location: "Acme HQ" },
    { id: "new", name: "New Year", date: "2025-01-01", location: "Acme HQ" },
  ]);

  it("returns every event of the year with its date, name and miles from the base address", async () => {
    const response = await request(appWith(repository))
      .get("/api/events")
      .query({ year: 2024 })
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.year).toBe(2024);
    expect(response.body.baseAddress).toBe("Home");
    expect(response.body.events.map((e: { id: string }) => e.id)).toEqual(["a", "b", "c"]);
    expect(response.body.events[0]).toMatchObject({ name: "Client visit - Acme", date: "2024-03-15" });
    expect(response.body.events.map((e: { miles: number | null }) => e.miles)).toEqual([42, null, 42]);
  });

  it("returns events without miles when the user has no base address", async () => {
    const response = await request(appWith(repository, null))
      .get("/api/events")
      .query({ year: 2024 })
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.baseAddress).toBeNull();
    expect(response.body.events.map((e: { miles: number | null }) => e.miles)).toEqual([null, null, null]);
  });

  it("uses the base address saved through the settings endpoint", async () => {
    const app = testApp({
      eventRepository: repository,
      geocoder: new FakeGeocoder({ "New Home": { latitude: 0, longitude: 0 } }),
      distanceCalculator: new FakeDistanceCalculator({ "New Home -> Acme HQ": 7 }),
    });

    await request(app).put("/api/settings").set("Authorization", "Bearer token").send({ baseAddress: "New Home" });
    const response = await request(app).get("/api/events").query({ year: 2024 }).set("Authorization", "Bearer token");

    expect(response.body.baseAddress).toBe("New Home");
    expect(response.body.events[0].miles).toBe(7);
  });

  it("returns an empty list for a year without events", async () => {
    const response = await request(appWith(repository))
      .get("/api/events")
      .query({ year: 2022 })
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.events).toEqual([]);
  });

  it("requires a Google access token", async () => {
    const response = await request(appWith(repository)).get("/api/events").query({ year: 2024 });
    expect(response.status).toBe(401);
  });

  it.each([[{ year: 1899 }], [{ year: new Date().getFullYear() + 1 }], [{ year: "abc" }], [{}]])("rejects invalid query %o", async (query) => {
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
      .query({ year: 2024 })
      .set("Authorization", "Bearer token");
    expect(response.status).toBe(401);
  });
});
