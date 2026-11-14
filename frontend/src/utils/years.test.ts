import { selectableYears } from "./years";

describe("selectableYears", () => {
  it("offers the current year down to 1900, newest first", () => {
    const years = selectableYears(new Date(2026, 10, 14));
    expect(years[0]).toBe(2026);
    expect(years.at(-1)).toBe(1900);
    expect(years).toHaveLength(2026 - 1900 + 1);
  });
});
