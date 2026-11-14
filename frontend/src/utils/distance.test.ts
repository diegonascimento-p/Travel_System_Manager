import { convertMiles, formatDistance, KM_PER_MILE, totalMiles } from "./distance";

describe("convertMiles", () => {
  it("converts miles to kilometers using 1 mile = 1.609344 km", () => {
    expect(KM_PER_MILE).toBe(1.609344);
    expect(convertMiles(10, "km")).toBeCloseTo(16.09344, 10);
    expect(convertMiles(1, "km")).toBe(1.609344);
  });

  it("keeps miles unchanged", () => {
    expect(convertMiles(12.345, "mi")).toBe(12.345);
  });
});

describe("formatDistance", () => {
  it("shows miles with one decimal place and the 'mi' label", () => {
    expect(formatDistance(12.345, "mi")).toBe("12.3 mi");
    expect(formatDistance(42, "mi")).toBe("42.0 mi");
    expect(formatDistance(0, "mi")).toBe("0.0 mi");
  });

  it("shows kilometers with one decimal place and the 'km' label", () => {
    expect(formatDistance(10, "km")).toBe("16.1 km");
    expect(formatDistance(12.345, "km")).toBe("19.9 km");
  });

  it("adds thousands separators", () => {
    expect(formatDistance(1234.5, "mi")).toBe("1,234.5 mi");
    expect(formatDistance(1000, "km")).toBe("1,609.3 km");
  });

  it("shows N/A when the distance is unknown", () => {
    expect(formatDistance(null, "mi")).toBe("N/A");
    expect(formatDistance(null, "km")).toBe("N/A");
  });
});

describe("totalMiles", () => {
  it("sums the unrounded known distances, skipping unknown ones", () => {
    expect(totalMiles([1.04, 1.04, null, 1.04])).toBeCloseTo(3.12, 10);
    expect(totalMiles([])).toBe(0);
  });
});
