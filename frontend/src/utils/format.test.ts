import { formatEventDate } from "./format";

describe("formatEventDate", () => {
  it("shows day, month name and year", () => {
    expect(formatEventDate("2024-03-15")).toBe("15 March 2024");
    expect(formatEventDate("2024-12-31")).toBe("31 December 2024");
  });
});
