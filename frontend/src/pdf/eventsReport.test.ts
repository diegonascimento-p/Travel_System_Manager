import type { EventWithMiles } from "../models/event";
import { buildEventsReport } from "./eventsReport";

const event = (overrides: Partial<EventWithMiles>): EventWithMiles => ({
  id: "id",
  name: "Event",
  date: "2024-01-01",
  location: "Somewhere",
  distanceMeters: 1609.344,
  miles: 1,
  ...overrides,
});

describe("buildEventsReport", () => {
  it("lists every event with its date, name and miles, oldest first", () => {
    const report = buildEventsReport(2024, [
      event({ id: "b", name: "Review", date: "2024-09-20", miles: 10.25 }),
      event({ id: "a", name: "Client visit - Acme", date: "2024-03-15", miles: 42 }),
      event({ id: "c", name: "Workshop", date: "2024-06-01", miles: null }),
    ]);

    expect(report.head).toEqual(["Date", "Event", "Miles traveled"]);
    expect(report.rows).toEqual([
      ["15 March 2024", "Client visit - Acme", "42"],
      ["1 June 2024", "Workshop", "N/A"],
      ["20 September 2024", "Review", "10.3"],
    ]);
  });

  it("titles and names the file after the year", () => {
    const report = buildEventsReport(2024, []);
    expect(report.title).toBe("Miles traveled in 2024");
    expect(report.fileName).toBe("miles-traveled-2024.pdf");
  });
});
