import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { SettingsRepository } from "../src/repositories/SettingsRepository.js";
import { FakeGeocoder, InMemoryEventRepository } from "./fakes.js";
import { migratedSettingsRepository, migratedTripRepository } from "./tripDatabase.js";

function appWith(settingsRepository: SettingsRepository = migratedSettingsRepository()) {
  return createApp({
    eventRepository: new InMemoryEventRepository([]),
    geocoder: new FakeGeocoder({}),
    tripRepository: migratedTripRepository(),
    settingsRepository,
  });
}

describe("GET /api/settings", () => {
  it("returns miles when no unit was chosen", async () => {
    const response = await request(appWith()).get("/api/settings");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ distanceUnit: "mi" });
  });
});

describe("PUT /api/settings", () => {
  it("saves the distance unit to the account", async () => {
    const app = appWith();

    const response = await request(app).put("/api/settings").send({ distanceUnit: "km" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ distanceUnit: "km" });
    expect((await request(app).get("/api/settings")).body).toEqual({ distanceUnit: "km" });
  });

  it("keeps the unit for later sessions, as it is stored in the database", async () => {
    const repository = migratedSettingsRepository();
    await request(appWith(repository)).put("/api/settings").send({ distanceUnit: "km" });

    const response = await request(appWith(repository)).get("/api/settings");

    expect(response.body).toEqual({ distanceUnit: "km" });
  });

  it("rejects an unknown unit", async () => {
    const app = appWith();

    const response = await request(app).put("/api/settings").send({ distanceUnit: "yd" });

    expect(response.status).toBe(400);
    expect(response.body.fields).toEqual({ distanceUnit: 'Distance unit must be "mi" or "km".' });
    expect((await request(app).get("/api/settings")).body).toEqual({ distanceUnit: "mi" });
  });

  it("rejects malformed JSON", async () => {
    const response = await request(appWith())
      .put("/api/settings")
      .set("Content-Type", "application/json")
      .send("{not json");

    expect(response.status).toBe(400);
  });
});
