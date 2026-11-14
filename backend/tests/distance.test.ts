import { describe, expect, it } from "vitest";
import { milesBetween } from "../src/services/distance.js";

describe("milesBetween", () => {
  it("is zero for the same point", () => {
    expect(milesBetween({ latitude: 40, longitude: -74 }, { latitude: 40, longitude: -74 })).toBe(0);
  });

  it("returns the great-circle distance in miles", () => {
    const newYork = { latitude: 40.7128, longitude: -74.006 };
    const losAngeles = { latitude: 34.0522, longitude: -118.2437 };
    expect(milesBetween(newYork, losAngeles)).toBeCloseTo(2445.6, 0);
  });
});
