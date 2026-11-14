import { describe, expect, it, vi } from "vitest";
import { GoogleDistanceMatrix } from "../src/services/GoogleDistanceMatrix.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const element = (meters: number) => ({ status: "OK", distance: { value: meters } });

describe("GoogleDistanceMatrix", () => {
  it("returns the driving meters from the origin to each destination in one request", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      json({ status: "OK", rows: [{ elements: [element(10_000), { status: "NOT_FOUND" }] }] }),
    );
    const matrix = new GoogleDistanceMatrix("key", fetchFn);

    const meters = await matrix.metersFrom("Home", ["Acme HQ", "Atlantis", "Acme HQ"]);

    expect(meters).toEqual(new Map([["Acme HQ", 10_000]]));
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://maps.googleapis.com/maps/api/distancematrix/json");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      origins: "Home",
      destinations: "Acme HQ|Atlantis",
      mode: "driving",
      key: "key",
    });
  });

  it("returns the driving meters from each origin back to the destination in one request", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      json({ status: "OK", rows: [{ elements: [element(11_000)] }, { elements: [{ status: "ZERO_RESULTS" }] }] }),
    );
    const matrix = new GoogleDistanceMatrix("key", fetchFn);

    const meters = await matrix.metersTo(["Acme HQ", "Island"], "Home");

    expect(meters).toEqual(new Map([["Acme HQ", 11_000]]));
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.searchParams.get("origins")).toBe("Acme HQ|Island");
    expect(url.searchParams.get("destinations")).toBe("Home");
  });

  it("caches distances per origin and destination, keeping each direction separate", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => json({ status: "OK", rows: [{ elements: [element(1000)] }] }));
    const matrix = new GoogleDistanceMatrix("key", fetchFn);

    await matrix.metersFrom("Home", ["Acme HQ"]);
    await matrix.metersFrom("home", ["acme hq"]);
    await matrix.metersFrom("New Home", ["Acme HQ"]);
    await matrix.metersTo(["Acme HQ"], "Home");

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(new URL(String(fetchFn.mock.calls[1][0])).searchParams.get("origins")).toBe("New Home");
    expect(new URL(String(fetchFn.mock.calls[2][0])).searchParams.get("origins")).toBe("Acme HQ");
  });

  it("splits more than 25 addresses into several requests", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const origins = new URL(String(input)).searchParams.get("origins")!.split("|").length;
      return json({ status: "OK", rows: Array.from({ length: origins }, () => ({ elements: [element(1000)] })) });
    });
    const origins = Array.from({ length: 30 }, (_, i) => `Place ${i}`);

    const meters = await new GoogleDistanceMatrix("key", fetchFn).metersTo(origins, "Home");

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(meters.size).toBe(30);
  });

  it("fails when Google rejects the request, without caching the failure", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ status: "REQUEST_DENIED", rows: [] }))
      .mockResolvedValueOnce(json({ status: "OK", rows: [{ elements: [element(1000)] }] }));
    const matrix = new GoogleDistanceMatrix("key", fetchFn);

    await expect(matrix.metersFrom("Home", ["Acme HQ"])).rejects.toThrow("REQUEST_DENIED");
    await expect(matrix.metersFrom("Home", ["Acme HQ"])).resolves.toEqual(new Map([["Acme HQ", 1000]]));
  });
});
