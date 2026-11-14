import { describe, expect, it, vi } from "vitest";
import { GoogleDistanceMatrix } from "../src/services/GoogleDistanceMatrix.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const element = (meters: number) => ({ status: "OK", distance: { value: meters } });

describe("GoogleDistanceMatrix", () => {
  it("returns the driving miles from the origin to each destination in one request", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      json({ status: "OK", rows: [{ elements: [element(1609.344 * 42), { status: "NOT_FOUND" }] }] }),
    );
    const matrix = new GoogleDistanceMatrix("key", fetchFn);

    const miles = await matrix.milesFrom("Home", ["Acme HQ", "Atlantis", "Acme HQ"]);

    expect(miles.get("Acme HQ")).toBeCloseTo(42, 6);
    expect(miles.has("Atlantis")).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://maps.googleapis.com/maps/api/distancematrix/json");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      origins: "Home",
      destinations: "Acme HQ|Atlantis",
      mode: "driving",
      units: "imperial",
      key: "key",
    });
  });

  it("caches distances per origin and destination", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => json({ status: "OK", rows: [{ elements: [element(1609.344)] }] }));
    const matrix = new GoogleDistanceMatrix("key", fetchFn);

    await matrix.milesFrom("Home", ["Acme HQ"]);
    await matrix.milesFrom("home", ["acme hq"]);
    await matrix.milesFrom("New Home", ["Acme HQ"]);

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchFn.mock.calls[1][0])).searchParams.get("origins")).toBe("New Home");
  });

  it("splits more than 25 destinations into several requests", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const count = new URL(String(input)).searchParams.get("destinations")!.split("|").length;
      return json({ status: "OK", rows: [{ elements: Array.from({ length: count }, () => element(1609.344)) }] });
    });
    const destinations = Array.from({ length: 30 }, (_, i) => `Place ${i}`);

    const miles = await new GoogleDistanceMatrix("key", fetchFn).milesFrom("Home", destinations);

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(miles.size).toBe(30);
  });

  it("fails when Google rejects the request, without caching the failure", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ status: "REQUEST_DENIED", rows: [] }))
      .mockResolvedValueOnce(json({ status: "OK", rows: [{ elements: [element(1609.344)] }] }));
    const matrix = new GoogleDistanceMatrix("key", fetchFn);

    await expect(matrix.milesFrom("Home", ["Acme HQ"])).rejects.toThrow("REQUEST_DENIED");
    await expect(matrix.milesFrom("Home", ["Acme HQ"])).resolves.toEqual(new Map([["Acme HQ", 1]]));
  });
});
