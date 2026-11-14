import { formatDistance, formatEventDate, formatMiles } from "./format";

describe("formatEventDate", () => {
  it("shows day, month name and year", () => {
    expect(formatEventDate("2024-03-15")).toBe("15 March 2024");
    expect(formatEventDate("2024-12-31")).toBe("31 December 2024");
  });
});

describe("formatMiles", () => {
  it("shows whole miles without decimals and others with one decimal", () => {
    expect(formatMiles(42)).toBe("42");
    expect(formatMiles(41.96)).toBe("42");
    expect(formatMiles(12.34)).toBe("12.3");
  });

  it("shows N/A when miles are unknown", () => {
    expect(formatMiles(null)).toBe("N/A");
  });
});

describe("formatDistance", () => {
  it("shows miles with at most one decimal and thousands separators", () => {
    expect(formatDistance(0)).toBe("0 mi");
    expect(formatDistance(42.46)).toBe("42.5 mi");
    expect(formatDistance(1234.5)).toBe("1,234.5 mi");
  });
});
