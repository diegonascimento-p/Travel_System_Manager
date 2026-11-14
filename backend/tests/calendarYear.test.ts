import { describe, expect, it } from "vitest";
import { isInYear, isSupportedYear, yearBounds } from "../src/services/calendarYear.js";

describe("calendarYear", () => {
  const today = new Date(2026, 10, 14);

  it("supports years from 1900 to the current year", () => {
    expect(isSupportedYear(1900, today)).toBe(true);
    expect(isSupportedYear(2026, today)).toBe(true);
    expect(isSupportedYear(1899, today)).toBe(false);
    expect(isSupportedYear(2027, today)).toBe(false);
    expect(isSupportedYear(2024.5, today)).toBe(false);
    expect(isSupportedYear(Number.NaN, today)).toBe(false);
  });

  it("gives the first and last day of the year", () => {
    expect(yearBounds(2024)).toEqual({ from: "2024-01-01", to: "2024-12-31" });
  });

  it("matches dates by calendar year only", () => {
    expect(isInYear("2024-01-01", 2024)).toBe(true);
    expect(isInYear("2024-12-31", 2024)).toBe(true);
    expect(isInYear("2023-12-31", 2024)).toBe(false);
    expect(isInYear("2025-01-01", 2024)).toBe(false);
  });
});
