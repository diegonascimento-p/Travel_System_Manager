import { describe, expect, it, vi } from "vitest";
import { NominatimGeocoder } from "../src/services/NominatimGeocoder.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const USER_AGENT = "TravelSystemManager/test (dev@example.com)";

/** A fake clock whose sleep advances time, recording each wait. */
function fakeClock() {
  let time = 10_000;
  const sleeps: number[] = [];
  return {
    now: () => time,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      time += ms;
    },
    advance: (ms: number) => {
      time += ms;
    },
    sleeps,
  };
}

function geocoderWith(fetchFn: typeof fetch, clock = fakeClock()) {
  return new NominatimGeocoder({ userAgent: USER_AGENT, fetchFn, now: clock.now, sleep: clock.sleep });
}

describe("NominatimGeocoder", () => {
  it("returns the coordinates of the first Nominatim search result", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json([{ lat: "1.5", lon: "-2.5" }]));

    await expect(geocoderWith(fetchFn).geocode(" Acme HQ ")).resolves.toEqual({ latitude: 1.5, longitude: -2.5 });

    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://nominatim.openstreetmap.org/search");
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: "Acme HQ", format: "jsonv2", limit: "1" });
  });

  it("sends an identifying User-Agent header", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json([{ lat: "1", lon: "2" }]));

    await geocoderWith(fetchFn).geocode("Acme HQ");

    const headers = new Headers(fetchFn.mock.calls[0][1]?.headers);
    expect(headers.get("User-Agent")).toBe(USER_AGENT);
  });

  it("uses a configured base URL", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json([]));
    const geocoder = new NominatimGeocoder({ userAgent: USER_AGENT, baseUrl: "http://maps.local/nominatim/", fetchFn });

    await geocoder.geocode("Acme HQ");

    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("http://maps.local/nominatim/search");
  });

  it("returns null when Nominatim finds nothing", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json([]));
    await expect(geocoderWith(fetchFn).geocode("Atlantis")).resolves.toBeNull();
  });

  it("uses the cached result for an address already geocoded, including one not found", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input) =>
        json(new URL(String(input)).searchParams.get("q") === "Atlantis" ? [] : [{ lat: "1", lon: "2" }]),
      );
    const geocoder = geocoderWith(fetchFn);

    await geocoder.geocode("Acme HQ");
    await geocoder.geocode("acme hq ");
    await geocoder.geocode("Atlantis");
    await expect(geocoder.geocode("Atlantis")).resolves.toBeNull();

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("spaces requests for different addresses at least one second apart, even when called together", async () => {
    const clock = fakeClock();
    const sentAt: number[] = [];
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(async () => {
      sentAt.push(clock.now());
      return json([{ lat: "1", lon: "2" }]);
    });
    const geocoder = geocoderWith(fetchFn, clock);

    await Promise.all([geocoder.geocode("A"), geocoder.geocode("B"), geocoder.geocode("C"), geocoder.geocode("A")]);

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(sentAt[1] - sentAt[0]).toBeGreaterThanOrEqual(1000);
    expect(sentAt[2] - sentAt[1]).toBeGreaterThanOrEqual(1000);
  });

  it("does not wait when the last request was more than a second ago", async () => {
    const clock = fakeClock();
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(async () => json([{ lat: "1", lon: "2" }]));
    const geocoder = geocoderWith(fetchFn, clock);

    await geocoder.geocode("A");
    clock.advance(1500);
    await geocoder.geocode("B");

    expect(clock.sleeps).toEqual([]);
  });

  it("fails on an error response without caching the failure, and keeps throttling", async () => {
    const clock = fakeClock();
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ error: "busy" }, 503))
      .mockResolvedValueOnce(json([{ lat: "1", lon: "2" }]));
    const geocoder = geocoderWith(fetchFn, clock);

    await expect(geocoder.geocode("Acme HQ")).rejects.toThrow("503");
    await expect(geocoder.geocode("Acme HQ")).resolves.toEqual({ latitude: 1, longitude: 2 });
    expect(clock.sleeps).toEqual([1000]);
  });

  it("fails when the request errors or times out", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    await expect(geocoderWith(fetchFn).geocode("Acme HQ")).rejects.toThrow("timed out");
  });
});
