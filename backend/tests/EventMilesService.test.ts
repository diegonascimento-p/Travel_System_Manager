import { describe, expect, it } from "vitest";
import { EventMilesService } from "../src/services/EventMilesService.js";
import { UserProfileService } from "../src/services/UserProfileService.js";
import {
  FakeDistanceCalculator,
  FakeGeocoder,
  FakeUserIdentityRepository,
  InMemoryEventMileageRepository,
  InMemoryEventRepository,
  InMemoryUserProfileRepository,
  symmetric,
} from "./fakes.js";
import type { CalendarEvent } from "../src/models/Event.js";

const meters = {
  "Home -> Acme HQ": 10_000,
  "Acme HQ -> Home": 11_000,
  ...symmetric(["Home", "Office", 2_000], ["New Home", "Acme HQ", 4_000], ["Home", "New Office", 3_000]),
};

function serviceWith(events: CalendarEvent[], baseAddress: string | null = "Home") {
  const repository = new InMemoryEventRepository(events);
  const profiles = new InMemoryUserProfileRepository();
  if (baseAddress) profiles.profiles.set("user@example.com", { baseAddress });
  const distances = new FakeDistanceCalculator(meters);
  const mileages = new InMemoryEventMileageRepository();
  const profileService = new UserProfileService(
    new FakeUserIdentityRepository(),
    profiles,
    new FakeGeocoder({ "New Home": { latitude: 0, longitude: 0 } }),
  );
  const service = new EventMilesService(repository, profileService, distances, mileages);
  return { service, repository, profileService, distances, mileages };
}

const acme: CalendarEvent = { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ" };

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

  it("calculates the round trip from the base address to the location and back with the distance calculator", async () => {
    const { service, distances } = serviceWith([acme]);

    const { baseAddress, events } = await service.getEventsForYear("token", 2024);

    expect(baseAddress).toBe("Home");
    expect(events[0]).toMatchObject({ ...acme, distanceMeters: 21_000 });
    expect(events[0].miles).toBeCloseTo(21_000 / 1609.344, 6);
    expect(distances.calls).toEqual([
      { origins: ["Home"], destinations: ["Acme HQ"] },
      { origins: ["Acme HQ"], destinations: ["Home"] },
    ]);
  });

  it("calculates each event from its own location", async () => {
    const { service } = serviceWith([
      acme,
      { id: "b", name: "Office", date: "2024-03-16", location: "Office" },
      { id: "c", name: "Acme again", date: "2024-03-17", location: "Acme HQ" },
    ]);

    const { events } = await service.getEventsForYear("token", 2024);

    expect(events.map((e) => e.distanceMeters)).toEqual([21_000, 4_000, 21_000]);
  });

  it("saves the mileage with the event and reuses it on the next load", async () => {
    const { service, distances, mileages } = serviceWith([acme]);

    await service.getEventsForYear("token", 2024);
    const { events } = await service.getEventsForYear("token", 2024);

    expect(mileages.saved.get("user@example.com/a")).toEqual({
      eventId: "a",
      baseAddress: "Home",
      location: "Acme HQ",
      distanceMeters: 21_000,
    });
    expect(events[0].distanceMeters).toBe(21_000);
    expect(distances.calls).toHaveLength(2);
  });

  it("recalculates after the user changes the base address", async () => {
    const { service, profileService } = serviceWith([acme]);
    await service.getEventsForYear("token", 2024);

    await profileService.updateProfile("token", { baseAddress: "New Home" });
    const { baseAddress, events } = await service.getEventsForYear("token", 2024);

    expect(baseAddress).toBe("New Home");
    expect(events[0].distanceMeters).toBe(8_000);
  });

  it("recalculates when the event's location changes", async () => {
    const events: CalendarEvent[] = [{ id: "b", name: "Office", date: "2024-03-16", location: "Office" }];
    const { service } = serviceWith(events);
    await service.getEventsForYear("token", 2024);

    events[0] = { ...events[0], location: "New Office" };
    const result = await service.getEventsForYear("token", 2024);

    expect(result.events[0].distanceMeters).toBe(6_000);
  });

  it("leaves mileage empty without a base address and does not calculate distances", async () => {
    const { service, distances } = serviceWith([acme], null);

    const { baseAddress, events } = await service.getEventsForYear("token", 2024);

    expect(baseAddress).toBeNull();
    expect(events[0]).toMatchObject({ distanceMeters: null, miles: null });
    expect(distances.calls).toEqual([]);
  });

  it("leaves mileage empty for events without a location or whose location cannot be found, without failing the rest", async () => {
    const { service, distances, mileages } = serviceWith([
      { id: "n", name: "No location", date: "2024-02-01", location: null },
      { id: "e", name: "Empty location", date: "2024-02-02", location: "  " },
      { id: "u", name: "Unknown place", date: "2024-02-03", location: "Atlantis" },
      { id: "b", name: "Office", date: "2024-02-04", location: "Office" },
    ]);

    const { events } = await service.getEventsForYear("token", 2024);

    expect(events.map((e) => e.distanceMeters)).toEqual([null, null, null, 4_000]);
    expect(events.map((e) => e.miles?.toFixed(2) ?? null)).toEqual([null, null, null, "2.49"]);
    expect(distances.calls[0]).toEqual({ origins: ["Home"], destinations: ["Atlantis", "Office"] });
    expect(mileages.saved.get("user@example.com/u")?.distanceMeters).toBeNull();
  });

  it("shows no mileage and saves nothing when the map services fail, so it is retried on the next load", async () => {
    const { service, distances, mileages } = serviceWith([acme]);
    distances.failure = new Error("OVER_QUERY_LIMIT");

    const { events } = await service.getEventsForYear("token", 2024);

    expect(events[0].distanceMeters).toBeNull();
    expect(mileages.saved.size).toBe(0);

    distances.failure = null;
    expect((await service.getEventsForYear("token", 2024)).events[0].distanceMeters).toBe(21_000);
  });

  it("returns an empty list for a year without events", async () => {
    const { service } = serviceWith([]);
    await expect(service.getEventsForYear("token", 2022)).resolves.toEqual({ baseAddress: "Home", events: [] });
  });
});
