import { describe, expect, it } from "vitest";
import { EventMilesService } from "../src/services/EventMilesService.js";
import { FakeGeocoder, InMemoryEventRepository } from "./fakes.js";

const origin = { latitude: 0, longitude: 0 };
// One degree of latitude is ~69.09 miles.
const places = {
  "Acme HQ": { latitude: 42 / 69.0941, longitude: 0 },
  Office: { latitude: 0, longitude: 0 },
};

describe("EventMilesService.getEventsForYear", () => {
  it("returns only events in the calendar year, oldest first", async () => {
    const repository = new InMemoryEventRepository([
      { id: "a", name: "New Year's Eve", date: "2023-12-31", location: "Office" },
      { id: "b", name: "Autumn", date: "2024-10-01", location: "Office" },
      { id: "c", name: "First day", date: "2024-01-01", location: "Office" },
      { id: "d", name: "Last day", date: "2024-12-31", location: "Office" },
      { id: "e", name: "New Year", date: "2025-01-01", location: "Office" },
    ]);
    const service = new EventMilesService(repository, new FakeGeocoder(places));

    const events = await service.getEventsForYear("token", 2024, origin);

    expect(events.map((e) => e.id)).toEqual(["c", "b", "d"]);
    expect(repository.calls).toEqual([{ accessToken: "token", from: "2024-01-01", to: "2024-12-31" }]);
  });

  it("calculates miles from the current position to the event location", async () => {
    const repository = new InMemoryEventRepository([
      { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ" },
    ]);
    const service = new EventMilesService(repository, new FakeGeocoder(places));

    const [event] = await service.getEventsForYear("token", 2024, origin);

    expect(event).toMatchObject({ name: "Client visit - Acme", date: "2024-03-15" });
    expect(event.miles).toBeCloseTo(42, 1);
  });

  it("leaves miles empty when the event location is missing or unknown", async () => {
    const repository = new InMemoryEventRepository([
      { id: "a", name: "No location", date: "2024-02-01", location: null },
      { id: "b", name: "Unknown place", date: "2024-02-02", location: "Atlantis" },
    ]);
    const service = new EventMilesService(repository, new FakeGeocoder(places));

    const events = await service.getEventsForYear("token", 2024, origin);

    expect(events.map((e) => e.miles)).toEqual([null, null]);
  });

  it("returns an empty list for a year without events", async () => {
    const service = new EventMilesService(new InMemoryEventRepository([]), new FakeGeocoder(places));
    await expect(service.getEventsForYear("token", 2022, origin)).resolves.toEqual([]);
  });
});
