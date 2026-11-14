import { describe, expect, it, vi } from "vitest";
import { GoogleGeocoder } from "../src/services/GoogleGeocoder.js";

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

describe("GoogleGeocoder", () => {
  it("returns coordinates and caches repeated addresses", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockImplementation(async () =>
        json({ status: "OK", results: [{ geometry: { location: { lat: 1.5, lng: -2.5 } } }] }),
      );
    const geocoder = new GoogleGeocoder("key", fetchFn);

    await expect(geocoder.geocode("Acme HQ")).resolves.toEqual({ latitude: 1.5, longitude: -2.5 });
    await geocoder.geocode("acme hq");

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.searchParams.get("address")).toBe("Acme HQ");
    expect(url.searchParams.get("key")).toBe("key");
  });

  it("returns null when the address is not found", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json({ status: "ZERO_RESULTS", results: [] }));
    await expect(new GoogleGeocoder("key", fetchFn).geocode("Atlantis")).resolves.toBeNull();
  });
});
