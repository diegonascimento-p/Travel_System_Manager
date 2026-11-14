import { describe, expect, it, vi } from "vitest";
import { createMapServices, DEFAULT_MAPS_USER_AGENT } from "../src/services/mapServices.js";
import { NominatimGeocoder } from "../src/services/NominatimGeocoder.js";
import { OsrmDistanceCalculator } from "../src/services/OsrmDistanceCalculator.js";

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

describe("createMapServices", () => {
  it("creates the OpenStreetMap services without any Google Maps key", () => {
    const services = createMapServices({});
    expect(services.geocoder).toBeInstanceOf(NominatimGeocoder);
    expect(services.distanceCalculator).toBeInstanceOf(OsrmDistanceCalculator);
  });

  it("calls only Nominatim and the public OSRM server, with the default User-Agent", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      return url.hostname === "router.project-osrm.org"
        ? json({ code: "Ok", distances: [[1234]] })
        : json([{ lat: url.searchParams.get("q") === "Home" ? "1" : "2", lon: "3" }]);
    });
    const { distanceCalculator } = createMapServices({}, fetchFn);

    await expect(distanceCalculator.metersFrom("Home", ["Acme HQ"])).resolves.toEqual(new Map([["Acme HQ", 1234]]));

    const hosts = fetchFn.mock.calls.map(([input]) => new URL(String(input)).hostname);
    expect(hosts.sort()).toEqual(["nominatim.openstreetmap.org", "nominatim.openstreetmap.org", "router.project-osrm.org"]);
    expect(String(fetchFn.mock.calls.at(-1)![0])).toContain("3,1;3,2");
    for (const [, init] of fetchFn.mock.calls) {
      expect(new Headers(init?.headers).get("User-Agent")).toBe(DEFAULT_MAPS_USER_AGENT);
    }
  });

  it("uses the configured User-Agent and server URLs", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json([]));
    const { geocoder } = createMapServices(
      { MAPS_USER_AGENT: "MyCompanyMiles/1.0 (ops@example.com)", NOMINATIM_URL: "http://geo.local", OSRM_URL: "http://osrm.local" },
      fetchFn,
    );

    await geocoder.geocode("Home");

    expect(new URL(String(fetchFn.mock.calls[0][0])).origin).toBe("http://geo.local");
    expect(new Headers(fetchFn.mock.calls[0][1]?.headers).get("User-Agent")).toBe("MyCompanyMiles/1.0 (ops@example.com)");
  });
});
