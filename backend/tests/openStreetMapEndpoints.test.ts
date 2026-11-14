import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { SqliteEventMileageRepository } from "../src/repositories/SqliteEventMileageRepository.js";
import { SqliteUserProfileRepository } from "../src/repositories/SqliteUserProfileRepository.js";
import { createMapServices } from "../src/services/mapServices.js";
import { InMemoryEventRepository } from "./fakes.js";
import { testApp } from "./testApp.js";
import { migratedDatabase } from "./tripDatabase.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const PLACES: Record<string, { lat: string; lon: string }> = {
  "1 Main St, Springfield": { lat: "40.1", lon: "-75.1" },
  "Acme HQ": { lat: "40.2", lon: "-75.2" },
};

/** A fake of the public Nominatim and OSRM servers; set `failing` to make one of them return errors. */
function fakeOpenStreetMap() {
  const state = { failing: null as "nominatim" | "osrm" | null };
  const fetchFn = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    const url = new URL(String(input));
    if (url.hostname === "nominatim.openstreetmap.org") {
      if (state.failing === "nominatim") return json({ error: "Service unavailable" }, 503);
      const place = PLACES[url.searchParams.get("q") ?? ""];
      return json(place ? [place] : []);
    }
    if (url.hostname === "router.project-osrm.org") {
      if (state.failing === "osrm") return json({ code: "Error" }, 500);
      // From the base address to Acme HQ is 10 km, back is 11 km.
      return json({ code: "Ok", distances: url.searchParams.get("sources") === "0" ? [[10_000]] : [[11_000]] });
    }
    throw new Error(`Unexpected request to ${url.hostname}`);
  });
  return { state, fetchFn };
}

function appWith(fetchFn: typeof fetch, db = migratedDatabase()) {
  return testApp({
    ...createMapServices({}, fetchFn),
    eventRepository: new InMemoryEventRepository([{ id: "a", name: "Client visit", date: "2024-03-15", location: "Acme HQ" }]),
    userProfileRepository: new SqliteUserProfileRepository(db),
    eventMileageRepository: new SqliteEventMileageRepository(db),
  });
}

const saveBaseAddress = (app: ReturnType<typeof appWith>, baseAddress: string) =>
  request(app).put("/api/settings").set("Authorization", "Bearer token").send({ baseAddress });
const getSettings = (app: ReturnType<typeof appWith>) => request(app).get("/api/settings").set("Authorization", "Bearer token");
const loadEvents = (app: ReturnType<typeof appWith>) =>
  request(app).get("/api/events").query({ year: 2024 }).set("Authorization", "Bearer token");

describe("map services with OpenStreetMap", () => {
  it("checks the base address with Nominatim before saving it", async () => {
    const { fetchFn } = fakeOpenStreetMap();
    const app = appWith(fetchFn);

    const response = await saveBaseAddress(app, "1 Main St, Springfield");

    expect(response.status).toBe(200);
    expect(response.body.baseAddress).toBe("1 Main St, Springfield");
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.hostname).toBe("nominatim.openstreetmap.org");
    expect(url.searchParams.get("q")).toBe("1 Main St, Springfield");
    expect(new Headers(fetchFn.mock.calls[0][1]?.headers).get("User-Agent")).toMatch(/TravelSystemManager/);
  });

  it("rejects a base address Nominatim cannot find and does not store it", async () => {
    const app = appWith(fakeOpenStreetMap().fetchFn);

    const response = await saveBaseAddress(app, "Atlantis");

    expect(response.status).toBe(400);
    expect(response.body.fields.baseAddress).toMatch(/could not find this address/);
    expect((await getSettings(app)).body.baseAddress).toBeNull();
  });

  it("saves nothing when Nominatim fails while saving a base address", async () => {
    const { state, fetchFn } = fakeOpenStreetMap();
    state.failing = "nominatim";
    const app = appWith(fetchFn);

    const response = await saveBaseAddress(app, "1 Main St, Springfield");

    expect(response.status).toBe(502);
    expect((await getSettings(app)).body.baseAddress).toBeNull();
  });

  it("shows the OSRM round trip between the Nominatim coordinates, retrying after a failed load", async () => {
    const { state, fetchFn } = fakeOpenStreetMap();
    const db = migratedDatabase();
    const app = appWith(fetchFn, db);
    await saveBaseAddress(app, "1 Main St, Springfield");

    state.failing = "osrm";
    const failed = await loadEvents(app);
    expect(failed.status).toBe(200);
    expect(failed.body.events[0].distanceMeters).toBeNull();
    expect(await new SqliteEventMileageRepository(db).findByEventIds("user@example.com", ["a"])).toEqual(new Map());

    state.failing = null;
    const loaded = await loadEvents(app);
    expect(loaded.body.events[0].distanceMeters).toBe(21_000);

    const osrmCalls = fetchFn.mock.calls.map(([input]) => new URL(String(input))).filter((url) => url.hostname === "router.project-osrm.org");
    expect(decodeURIComponent(osrmCalls.at(-1)!.pathname)).toBe("/table/v1/driving/-75.1,40.1;-75.2,40.2");
    // Each address was looked up once with Nominatim; later loads use the cached coordinates.
    const nominatimQueries = fetchFn.mock.calls
      .map(([input]) => new URL(String(input)))
      .filter((url) => url.hostname === "nominatim.openstreetmap.org")
      .map((url) => url.searchParams.get("q"));
    expect(nominatimQueries).toEqual(["1 Main St, Springfield", "Acme HQ"]);
  });
});
