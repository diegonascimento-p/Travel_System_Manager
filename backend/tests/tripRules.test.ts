import { describe, expect, it } from "vitest";
import { isIsoDate, monthBounds, pageParams, roundDistance, validateTripInput } from "../src/services/tripRules.js";

const valid = {
  date: "2026-11-03",
  origin: "Office",
  destination: "Acme HQ",
  distance: 42.5,
  purpose: "Client visit",
};

describe("validateTripInput", () => {
  it("accepts a complete trip and trims its text fields", () => {
    const result = validateTripInput({ ...valid, origin: "  Office ", purpose: " Client visit\n" });
    expect(result).toEqual({ ok: true, value: valid });
  });

  it("requires every field", () => {
    const result = validateTripInput({});
    expect(result).toEqual({
      ok: false,
      errors: {
        date: "Date is required.",
        origin: "Origin is required.",
        destination: "Destination is required.",
        distance: "Distance is required.",
        purpose: "Purpose is required.",
      },
    });
  });

  it("treats blank text as missing", () => {
    const result = validateTripInput({ ...valid, origin: "   " });
    expect(result).toEqual({ ok: false, errors: { origin: "Origin is required." } });
  });

  it.each([["12"], ["abc"], [Number.NaN], [Number.POSITIVE_INFINITY], [true]])(
    "rejects the non-numeric distance %o",
    (distance) => {
      const result = validateTripInput({ ...valid, distance });
      expect(result).toEqual({ ok: false, errors: { distance: "Distance must be a number." } });
    },
  );

  it.each([[0], [-3]])("rejects the non-positive distance %o", (distance) => {
    const result = validateTripInput({ ...valid, distance });
    expect(result).toEqual({ ok: false, errors: { distance: "Distance must be greater than zero." } });
  });

  it("rejects distances above the maximum", () => {
    expect(validateTripInput({ ...valid, distance: 100_001 }).ok).toBe(false);
    expect(validateTripInput({ ...valid, distance: 100_000 }).ok).toBe(true);
  });

  it("rejects invalid dates", () => {
    const result = validateTripInput({ ...valid, date: "2026-02-30" });
    expect(result).toEqual({ ok: false, errors: { date: "Date must be a valid date (YYYY-MM-DD)." } });
  });

  it("limits the length of text fields", () => {
    const result = validateTripInput({ ...valid, destination: "x".repeat(201), purpose: "y".repeat(501) });
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors)).toEqual(["destination", "purpose"]);
  });

  it("rejects a body that is not an object", () => {
    expect(validateTripInput(null).ok).toBe(false);
    expect(validateTripInput("trip").ok).toBe(false);
  });
});

describe("isIsoDate", () => {
  it("accepts real dates written YYYY-MM-DD only", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2023-02-29")).toBe(false);
    expect(isIsoDate("2024-2-1")).toBe(false);
    expect(isIsoDate(20240101)).toBe(false);
  });
});

describe("monthBounds", () => {
  it("returns the first and last day of the month", () => {
    expect(monthBounds("2026-11")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(monthBounds("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
    expect(monthBounds("2026-12")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });

  it.each([["2026-13"], ["2026-1"], [""], [undefined]])("rejects the invalid month %o", (month) => {
    expect(monthBounds(month)).toBeNull();
  });
});

describe("pageParams", () => {
  it("defaults to the first page of 20 trips", () => {
    expect(pageParams(undefined, undefined)).toEqual({ limit: 20, offset: 0 });
  });

  it("rejects out of range or fractional values", () => {
    expect(pageParams(0, 0)).toBeNull();
    expect(pageParams(101, 0)).toBeNull();
    expect(pageParams(10, -1)).toBeNull();
    expect(pageParams(1.5, 0)).toBeNull();
    expect(pageParams(Number.NaN, 0)).toBeNull();
  });
});

describe("roundDistance", () => {
  it("removes floating point noise", () => {
    expect(roundDistance(0.1 + 0.2)).toBe(0.3);
  });
});
