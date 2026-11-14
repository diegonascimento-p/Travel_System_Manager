import { describe, expect, it } from "vitest";
import { EventMilesService } from "../src/services/EventMilesService.js";
import { UserProfileService } from "../src/services/UserProfileService.js";
import {
  FakeDistanceCalculator,
  FakeGeocoder,
  FakeUserIdentityRepository,
  InMemoryEventRepository,
  InMemoryUserProfileRepository,
} from "./fakes.js";
import type { CalendarEvent } from "../src/models/Event.js";

const miles = {
  "Home -> Acme HQ": 42,
  "Home -> Office": 3.5,
  "New Home -> Acme HQ": 10,
};

function serviceWith(events: CalendarEvent[], baseAddress: string | null = "Home") {
  const repository = new InMemoryEventRepository(events);
  const profiles = new InMemoryUserProfileRepository();
  if (baseAddress) profiles.profiles.set("user@example.com", { baseAddress });
  const distances = new FakeDistanceCalculator(miles);
  const profileService = new UserProfileService(
    new FakeUserIdentityRepository(),
    profiles,
    new FakeGeocoder({ "New Home": { latitude: 0, longitude: 0 } }),
  );
  const service = new EventMilesService(repository, profileService, distances);
  return { service, repository, profileService, distances };
}

describe("EventMilesService.getEventsForYear", () => {
  it("returns only events in the calendar year, oldest first", async () => {
    const { service, repository } = serviceWith([
      { id: "a", name: "New Year's Eve", date: "2023-12-31", location: "Office" },
      { id: "b", name: "Autumn", date: "2024-10-01", location: "Office" },
      { id: "c", name: "First day", date: "2024-01-01", location: "Office" },
      { id: "d", name: "Last day", date: "2024-12-31", location: "Office" },
      { id: "e", name: "New Year", date: "2025-01-01", location: "Office" },
    ]);

    const { events } = await service.getEventsForYear("token", 2024);

    expect(events.map((e) => e.id)).toEqual(["c", "b", "d"]);
    expect(repository.calls).toEqual([{ accessToken: "token", from: "2024-01-01", to: "2024-12-31" }]);
  });

  it("calculates miles from the user's base address to the event location", async () => {
    const { service, distances } = serviceWith([
      { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ" },
    ]);

    const { baseAddress, events } = await service.getEventsForYear("token", 2024);

    expect(baseAddress).toBe("Home");
    expect(events[0]).toEqual({ id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ", miles: 42 });
    expect(distances.calls).toEqual([{ origin: "Home", destinations: ["Acme HQ"] }]);
  });

  it("calculates each event separately from the base address to its own location", async () => {
    const { service } = serviceWith([
      { id: "a", name: "Acme", date: "2024-03-15", location: "Acme HQ" },
      { id: "b", name: "Office", date: "2024-03-16", location: "Office" },
      { id: "c", name: "Acme again", date: "2024-03-17", location: "Acme HQ" },
    ]);

    const { events } = await service.getEventsForYear("token", 2024);

    expect(events.map((e) => e.miles)).toEqual([42, 3.5, 42]);
  });

  it("uses the new base address after the user changes it", async () => {
    const { service, profileService } = serviceWith([
      { id: "a", name: "Acme", date: "2024-03-15", location: "Acme HQ" },
    ]);

    await profileService.updateProfile("token", { baseAddress: "New Home" });
    const { baseAddress, events } = await service.getEventsForYear("token", 2024);

    expect(baseAddress).toBe("New Home");
    expect(events[0].miles).toBe(10);
  });

  it("leaves miles empty without a base address and does not call Google Maps", async () => {
    const { service, distances } = serviceWith(
      [{ id: "a", name: "Acme", date: "2024-03-15", location: "Acme HQ" }],
      null,
    );

    const { baseAddress, events } = await service.getEventsForYear("token", 2024);

    expect(baseAddress).toBeNull();
    expect(events[0].miles).toBeNull();
    expect(distances.calls).toEqual([]);
  });

  it("leaves miles empty when the event location is missing or cannot be routed", async () => {
    const { service, distances } = serviceWith([
      { id: "a", name: "No location", date: "2024-02-01", location: null },
      { id: "b", name: "Unknown place", date: "2024-02-02", location: "Atlantis" },
    ]);

    const { events } = await service.getEventsForYear("token", 2024);

    expect(events.map((e) => e.miles)).toEqual([null, null]);
    expect(distances.calls).toEqual([{ origin: "Home", destinations: ["Atlantis"] }]);
  });

  it("returns an empty list for a year without events", async () => {
    const { service } = serviceWith([]);
    await expect(service.getEventsForYear("token", 2022)).resolves.toEqual({ baseAddress: "Home", events: [] });
  });
});
