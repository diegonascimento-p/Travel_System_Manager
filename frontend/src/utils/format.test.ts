import { formatDistance, formatEventDate, formatMeters, formatMiles } from "./format";

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

describe("formatMeters", () => {
  it("shows meters in miles when the unit is miles", () => {
    expect(formatMeters(16_093.44, "miles")).toBe("10 mi");
    expect(formatMeters(16_000, "miles")).toBe("9.9 mi");
  });

  it("shows meters in kilometers when the unit is kilometers", () => {
    expect(formatMeters(21_000, "kilometers")).toBe("21 km");
    expect(formatMeters(1_234_560, "kilometers")).toBe("1,234.6 km");
  });

  it("shows nothing when the distance is unknown", () => {
    expect(formatMeters(null, "miles")).toBe("");
    expect(formatMeters(null, "kilometers")).toBe("");
  });
});
