import { describe, expect, it } from "vitest";
import { metersToMiles, roundTripMeters } from "../src/services/roundTrip.js";
import { FakeDistanceCalculator } from "./fakes.js";

describe("roundTripMeters", () => {
  it("adds the distance from the base address to the location and from the location back", async () => {
    const distances = new FakeDistanceCalculator({ "Home -> Acme HQ": 10_000, "Acme HQ -> Home": 11_000 });

    const meters = await roundTripMeters(distances, "Home", ["Acme HQ"]);

    expect(meters.get("Acme HQ")).toBe(21_000);
    expect(distances.calls).toEqual([
      { origins: ["Home"], destinations: ["Acme HQ"] },
      { origins: ["Acme HQ"], destinations: ["Home"] },
    ]);
  });

  it("leaves out a location that cannot be routed in either direction", async () => {
    const distances = new FakeDistanceCalculator({ "Home -> One way": 5_000, "Back only -> Home": 5_000 });

    const meters = await roundTripMeters(distances, "Home", ["One way", "Back only", "Atlantis"]);

    expect(meters.size).toBe(0);
  });
});

describe("metersToMiles", () => {
  it("converts meters to miles", () => {
    expect(metersToMiles(16_093.44)).toBeCloseTo(10, 6);
  });
});
