import { describe, expect, it } from "vitest";
import { UserProfileService, UserProfileValidationError } from "../src/services/UserProfileService.js";
import { FakeGeocoder, FakeUserIdentityRepository, InMemoryUserProfileRepository } from "./fakes.js";

const geocoder = new FakeGeocoder({
  "1 Main St, Springfield": { latitude: 1, longitude: 1 },
  "2 Oak Ave, Springfield": { latitude: 2, longitude: 2 },
});

function setup() {
  const profiles = new InMemoryUserProfileRepository();
  const identities = new FakeUserIdentityRepository({ alice: "alice@example.com", bob: "bob@example.com" });
  return { profiles, service: new UserProfileService(identities, profiles, geocoder) };
}

describe("UserProfileService", () => {
  it("returns an empty base address before the user saves one", async () => {
    await expect(setup().service.getProfile("alice")).resolves.toEqual({ baseAddress: null, distanceUnit: "miles" });
  });

  it("saves the trimmed base address on the user's profile", async () => {
    const { service, profiles } = setup();

    await expect(service.updateProfile("alice", { baseAddress: "  1 Main St, Springfield " })).resolves.toEqual({
      baseAddress: "1 Main St, Springfield",
      distanceUnit: "miles",
    });

    expect(profiles.profiles.get("alice@example.com")).toEqual({ baseAddress: "1 Main St, Springfield", distanceUnit: "miles" });
    await expect(service.getProfile("bob")).resolves.toEqual({ baseAddress: null, distanceUnit: "miles" });
  });

  it("replaces the previous base address", async () => {
    const { service } = setup();
    await service.updateProfile("alice", { baseAddress: "1 Main St, Springfield" });

    await service.updateProfile("alice", { baseAddress: "2 Oak Ave, Springfield" });

    await expect(service.getProfile("alice")).resolves.toEqual({ baseAddress: "2 Oak Ave, Springfield", distanceUnit: "miles" });
  });

  it("clears the base address when it is saved empty", async () => {
    const { service } = setup();
    await service.updateProfile("alice", { baseAddress: "1 Main St, Springfield" });

    await expect(service.updateProfile("alice", { baseAddress: "  " })).resolves.toEqual({ baseAddress: null, distanceUnit: "miles" });
  });

  it.each([
    [{ baseAddress: "Atlantis" }, "Google Maps could not find this address."],
    [{ baseAddress: 12 }, "Base address must be text."],
    [{ baseAddress: "x".repeat(301) }, "Base address must be at most 300 characters."],
    [{}, "Base address is required."],
    [null, "Base address is required."],
  ])("rejects %o without saving", async (input, message) => {
    const { service, profiles } = setup();

    const error = await service.updateProfile("alice", input).catch((e) => e);

    expect(error).toBeInstanceOf(UserProfileValidationError);
    expect(error.fields).toEqual({ baseAddress: message });
    expect(profiles.profiles.size).toBe(0);
  });

  it("saves the chosen distance unit and keeps it when a later save omits it", async () => {
    const { service } = setup();

    await expect(service.updateProfile("alice", { baseAddress: "", distanceUnit: "kilometers" })).resolves.toEqual({
      baseAddress: null,
      distanceUnit: "kilometers",
    });
    await service.updateProfile("alice", { baseAddress: "1 Main St, Springfield" });

    await expect(service.getProfile("alice")).resolves.toEqual({
      baseAddress: "1 Main St, Springfield",
      distanceUnit: "kilometers",
    });
    await expect(service.getProfile("bob")).resolves.toEqual({ baseAddress: null, distanceUnit: "miles" });
  });

  it.each(["km", "yards", 1, null])("rejects the distance unit %o without saving", async (distanceUnit) => {
    const { service, profiles } = setup();

    const error = await service.updateProfile("alice", { baseAddress: "", distanceUnit }).catch((e) => e);

    expect(error).toBeInstanceOf(UserProfileValidationError);
    expect(error.fields).toEqual({ distanceUnit: 'Distance unit must be "miles" or "kilometers".' });
    expect(profiles.profiles.size).toBe(0);
  });
});
