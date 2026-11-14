import { describe, expect, it } from "vitest";
import { SqliteEventMileageRepository } from "../src/repositories/SqliteEventMileageRepository.js";
import { migratedDatabase } from "./tripDatabase.js";

describe("SqliteEventMileageRepository", () => {
  it("saves, reloads and replaces the mileage of a user's events", async () => {
    const repository = new SqliteEventMileageRepository(migratedDatabase());
    await repository.saveAll("alice@example.com", [
      { eventId: "a", baseAddress: "Home", location: "Acme HQ", distanceMeters: 21000 },
      { eventId: "b", baseAddress: "Home", location: "Atlantis", distanceMeters: null },
    ]);
    await repository.saveAll("bob@example.com", [
      { eventId: "a", baseAddress: "Elm St", location: "Office", distanceMeters: 500 },
    ]);

    const alice = await repository.findByEventIds("alice@example.com", ["a", "b", "missing"]);
    expect([...alice.values()]).toEqual([
      { eventId: "a", baseAddress: "Home", location: "Acme HQ", distanceMeters: 21000 },
      { eventId: "b", baseAddress: "Home", location: "Atlantis", distanceMeters: null },
    ]);

    await repository.saveAll("alice@example.com", [
      { eventId: "a", baseAddress: "New Home", location: "Acme HQ", distanceMeters: 9000 },
    ]);
    expect((await repository.findByEventIds("alice@example.com", ["a"])).get("a")).toEqual({
      eventId: "a",
      baseAddress: "New Home",
      location: "Acme HQ",
      distanceMeters: 9000,
    });
    expect((await repository.findByEventIds("bob@example.com", ["a"])).get("a")?.distanceMeters).toBe(500);
    expect((await repository.findByEventIds("alice@example.com", [])).size).toBe(0);
  });
});
