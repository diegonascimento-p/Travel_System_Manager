import request from "supertest";
import { describe, expect, it } from "vitest";
import { SqliteUserProfileRepository } from "../src/repositories/SqliteUserProfileRepository.js";
import { CalendarAccessError } from "../src/repositories/GoogleCalendarEventRepository.js";
import { FakeGeocoder, FakeUserIdentityRepository } from "./fakes.js";
import { testApp } from "./testApp.js";
import { migratedDatabase } from "./tripDatabase.js";

const geocoder = new FakeGeocoder({
  "1 Main St, Springfield": { latitude: 1, longitude: 1 },
  "2 Oak Ave, Springfield": { latitude: 2, longitude: 2 },
});
// Each sign-in gets a new access token for the same Google account.
const identities = new FakeUserIdentityRepository({
  "first-login": "alice@example.com",
  "second-login": "alice@example.com",
  other: "bob@example.com",
});

function appWith(db = migratedDatabase()) {
  return testApp({ geocoder, userIdentityRepository: identities, userProfileRepository: new SqliteUserProfileRepository(db) });
}

const get = (app: ReturnType<typeof appWith>, token: string) =>
  request(app).get("/api/settings").set("Authorization", `Bearer ${token}`);
const put = (app: ReturnType<typeof appWith>, token: string, body: unknown) =>
  request(app).put("/api/settings").set("Authorization", `Bearer ${token}`).send(body as object);

describe("/api/settings", () => {
  it("returns an empty base address and miles before anything is saved", async () => {
    const response = await get(appWith(), "first-login");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ baseAddress: null, distanceUnit: "miles" });
  });

  it("saves the base address on the profile and returns it after signing in again", async () => {
    const db = migratedDatabase();

    const saved = await put(appWith(db), "first-login", { baseAddress: "1 Main St, Springfield" });
    expect(saved.status).toBe(200);
    expect(saved.body).toEqual({ baseAddress: "1 Main St, Springfield", distanceUnit: "miles" });

    // A new app instance on the same database, like a server restart, with a new token.
    const response = await get(appWith(db), "second-login");
    expect(response.body).toEqual({ baseAddress: "1 Main St, Springfield", distanceUnit: "miles" });
    expect((await get(appWith(db), "other")).body).toEqual({ baseAddress: null, distanceUnit: "miles" });
  });

  it("replaces the saved base address with a new one", async () => {
    const app = appWith();
    await put(app, "first-login", { baseAddress: "1 Main St, Springfield" });

    const response = await put(app, "first-login", { baseAddress: "2 Oak Ave, Springfield" });

    expect(response.body).toEqual({ baseAddress: "2 Oak Ave, Springfield", distanceUnit: "miles" });
    expect((await get(app, "second-login")).body).toEqual({ baseAddress: "2 Oak Ave, Springfield", distanceUnit: "miles" });
  });

  it("rejects an address OpenStreetMap cannot find without changing the saved one", async () => {
    const app = appWith();
    await put(app, "first-login", { baseAddress: "1 Main St, Springfield" });

    const response = await put(app, "first-login", { baseAddress: "Atlantis" });

    expect(response.status).toBe(400);
    expect(response.body.fields).toEqual({ baseAddress: "OpenStreetMap could not find this address. Check the spelling or add the city and country." });
    expect((await get(app, "first-login")).body).toEqual({ baseAddress: "1 Main St, Springfield", distanceUnit: "miles" });
  });

  it("saves the distance unit on the account so it still applies after signing in again", async () => {
    const db = migratedDatabase();

    const saved = await put(appWith(db), "first-login", { baseAddress: "", distanceUnit: "kilometers" });
    expect(saved.status).toBe(200);
    expect(saved.body).toEqual({ baseAddress: null, distanceUnit: "kilometers" });

    expect((await get(appWith(db), "second-login")).body).toEqual({ baseAddress: null, distanceUnit: "kilometers" });
    expect((await get(appWith(db), "other")).body).toEqual({ baseAddress: null, distanceUnit: "miles" });

    await put(appWith(db), "second-login", { baseAddress: "", distanceUnit: "miles" });
    expect((await get(appWith(db), "first-login")).body.distanceUnit).toBe("miles");
  });

  it("rejects an unknown distance unit without changing the saved one", async () => {
    const app = appWith();
    await put(app, "first-login", { baseAddress: "", distanceUnit: "kilometers" });

    const response = await put(app, "first-login", { baseAddress: "", distanceUnit: "km" });

    expect(response.status).toBe(400);
    expect(response.body.fields).toEqual({ distanceUnit: 'Distance unit must be "miles" or "kilometers".' });
    expect((await get(app, "first-login")).body.distanceUnit).toBe("kilometers");
  });

  it("rejects a malformed JSON body", async () => {
    const response = await request(appWith())
      .put("/api/settings")
      .set("Authorization", "Bearer first-login")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(response.status).toBe(400);
  });

  it("requires a Google access token", async () => {
    expect((await request(appWith()).get("/api/settings")).status).toBe(401);
    expect((await request(appWith()).put("/api/settings").send({ baseAddress: "x", distanceUnit: "miles" })).status).toBe(401);
  });

  it("returns 401 when Google rejects the token", async () => {
    const app = testApp({
      userIdentityRepository: {
        findUserId: async () => {
          throw new CalendarAccessError("denied");
        },
      },
    });
    expect((await get(app, "expired")).status).toBe(401);
  });
});
