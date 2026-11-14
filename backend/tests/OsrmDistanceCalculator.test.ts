import { describe, expect, it, vi } from "vitest";
import { OsrmDistanceCalculator } from "../src/services/OsrmDistanceCalculator.js";
import { FakeGeocoder } from "./fakes.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const geocoder = new FakeGeocoder({
  Home: { latitude: 40.1, longitude: -75.1 },
  "Acme HQ": { latitude: 40.2, longitude: -75.2 },
  Island: { latitude: 41, longitude: -70 },
});

function calculatorWith(fetchFn: typeof fetch, baseUrl?: string) {
  return new OsrmDistanceCalculator(geocoder, { userAgent: "TSM/test", fetchFn, baseUrl });
}

describe("OsrmDistanceCalculator", () => {
  it("returns the driving meters from the origin to each destination using the geocoded coordinates", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json({ code: "Ok", distances: [[10_000, null]] }));

    const meters = await calculatorWith(fetchFn).metersFrom("Home", ["Acme HQ", "Atlantis", "Island", "Acme HQ"]);

    expect(meters).toEqual(new Map([["Acme HQ", 10_000]]));
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.origin).toBe("https://router.project-osrm.org");
    expect(decodeURIComponent(url.pathname)).toBe("/table/v1/driving/-75.1,40.1;-75.2,40.2;-70,41");
    expect(Object.fromEntries(url.searchParams)).toEqual({ sources: "0", destinations: "1;2", annotations: "distance" });
    expect(new Headers(fetchFn.mock.calls[0][1]?.headers).get("User-Agent")).toBe("TSM/test");
  });

  it("returns the driving meters from each origin back to the destination", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json({ code: "Ok", distances: [[11_000], [null]] }));

    const meters = await calculatorWith(fetchFn, "http://osrm.local/").metersTo(["Acme HQ", "Island"], "Home");

    expect(meters).toEqual(new Map([["Acme HQ", 11_000]]));
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.origin).toBe("http://osrm.local");
    expect(Object.fromEntries(url.searchParams)).toEqual({ sources: "1;2", destinations: "0", annotations: "distance" });
  });

  it("returns nothing without calling OSRM when the base address cannot be found", async () => {
    const fetchFn = vi.fn<typeof fetch>();
    await expect(calculatorWith(fetchFn).metersFrom("Atlantis", ["Acme HQ"])).resolves.toEqual(new Map());
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("splits many destinations into several requests", async () => {
    const places = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`Place ${i}`, { latitude: i, longitude: i }]));
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const count = new URL(String(input)).searchParams.get("sources")!.split(";").length;
      return json({ code: "Ok", distances: Array.from({ length: count }, () => [1000]) });
    });
    const calculator = new OsrmDistanceCalculator(new FakeGeocoder({ ...places, Home: { latitude: 0, longitude: 0 } }), {
      userAgent: "TSM/test",
      fetchFn,
    });

    const meters = await calculator.metersTo(Object.keys(places), "Home");

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(meters.size).toBe(60);
  });

  it("fails when OSRM responds with an error status or code", async () => {
    await expect(calculatorWith(vi.fn<typeof fetch>().mockResolvedValue(json({}, 500))).metersFrom("Home", ["Acme HQ"])).rejects.toThrow("500");
    await expect(
      calculatorWith(vi.fn<typeof fetch>().mockResolvedValue(json({ code: "InvalidQuery" }))).metersFrom("Home", ["Acme HQ"]),
    ).rejects.toThrow("InvalidQuery");
  });

  it("fails when geocoding fails", async () => {
    const failing = { geocode: vi.fn().mockRejectedValue(new Error("Nominatim down")) };
    const calculator = new OsrmDistanceCalculator(failing, { userAgent: "TSM/test", fetchFn: vi.fn<typeof fetch>() });
    await expect(calculator.metersFrom("Home", ["Acme HQ"])).rejects.toThrow("Nominatim down");
  });
});
