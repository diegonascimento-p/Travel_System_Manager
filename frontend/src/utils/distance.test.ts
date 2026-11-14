import { convertMiles, formatDistance, formatMeters, KM_PER_MILE, metersToMiles, totalDistance } from "./distance";

describe("convertMiles", () => {
  it("converts miles to kilometers using 1 mile = 1.609344 km", () => {
    expect(KM_PER_MILE).toBe(1.609344);
    expect(convertMiles(10, "kilometers")).toBeCloseTo(16.09344, 10);
    expect(convertMiles(1, "kilometers")).toBe(1.609344);
  });

  it("keeps miles unchanged", () => {
    expect(convertMiles(12.345, "miles")).toBe(12.345);
  });
});

describe("metersToMiles", () => {
  it("converts meters to miles", () => {
    expect(metersToMiles(16_093.44)).toBeCloseTo(10, 10);
  });
});

describe("formatDistance", () => {
  it("shows miles with one decimal place and the 'mi' label", () => {
    expect(formatDistance(12.345, "miles")).toBe("12.3 mi");
    expect(formatDistance(42, "miles")).toBe("42.0 mi");
    expect(formatDistance(0, "miles")).toBe("0.0 mi");
  });

  it("shows kilometers with one decimal place and the 'km' label", () => {
    expect(formatDistance(10, "kilometers")).toBe("16.1 km");
    expect(formatDistance(12.345, "kilometers")).toBe("19.9 km");
  });

  it("adds thousands separators", () => {
    expect(formatDistance(1234.5, "miles")).toBe("1,234.5 mi");
    expect(formatDistance(1000, "kilometers")).toBe("1,609.3 km");
  });

  it("shows N/A when the distance is unknown", () => {
    expect(formatDistance(null, "miles")).toBe("N/A");
    expect(formatDistance(null, "kilometers")).toBe("N/A");
  });
});

describe("formatMeters", () => {
  it("shows meters in miles when the unit is miles", () => {
    expect(formatMeters(16_093.44, "miles")).toBe("10.0 mi");
    expect(formatMeters(16_000, "miles")).toBe("9.9 mi");
  });

  it("shows meters in kilometers when the unit is kilometers", () => {
    expect(formatMeters(16_093.44, "kilometers")).toBe("16.1 km");
    expect(formatMeters(21_000, "kilometers")).toBe("21.0 km");
    expect(formatMeters(1_234_560, "kilometers")).toBe("1,234.6 km");
  });

  it("shows nothing when the distance is unknown", () => {
    expect(formatMeters(null, "miles")).toBe("");
    expect(formatMeters(null, "kilometers")).toBe("");
  });
});

describe("totalDistance", () => {
  it("sums the unrounded known distances, skipping unknown ones", () => {
    expect(totalDistance([1.04, 1.04, null, 1.04])).toBeCloseTo(3.12, 10);
    expect(totalDistance([])).toBe(0);
  });
});
