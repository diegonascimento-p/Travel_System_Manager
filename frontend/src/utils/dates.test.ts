import { formatMonth, localDate, localMonth } from "./dates";

describe("local dates", () => {
  it("uses the user's local calendar day and month", () => {
    const lateEvening = new Date(2026, 10, 30, 23, 59);
    expect(localMonth(lateEvening)).toBe("2026-11");
    expect(localDate(lateEvening)).toBe("2026-11-30");
    expect(localDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("formats a month with its name", () => {
    expect(formatMonth("2026-11")).toBe("November 2026");
  });
});
