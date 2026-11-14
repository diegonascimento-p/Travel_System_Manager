import { describe, expect, it } from "vitest";
import { SettingsService, SettingsValidationError } from "../src/services/SettingsService.js";
import { migratedSettingsRepository } from "./tripDatabase.js";

describe("SettingsService", () => {
  it("defaults to miles for a user who never chose a unit", async () => {
    const service = new SettingsService(migratedSettingsRepository());

    expect(await service.getSettings()).toEqual({ distanceUnit: "mi" });
  });

  it("saves the chosen unit and returns it on later reads", async () => {
    const service = new SettingsService(migratedSettingsRepository());

    expect(await service.saveSettings({ distanceUnit: "km" })).toEqual({ distanceUnit: "km" });
    expect(await service.getSettings()).toEqual({ distanceUnit: "km" });

    await service.saveSettings({ distanceUnit: "mi" });
    expect(await service.getSettings()).toEqual({ distanceUnit: "mi" });
  });

  it("rejects an unknown unit without saving it", async () => {
    const service = new SettingsService(migratedSettingsRepository());
    await service.saveSettings({ distanceUnit: "km" });

    await expect(service.saveSettings({ distanceUnit: "yd" })).rejects.toBeInstanceOf(SettingsValidationError);
    expect(await service.getSettings()).toEqual({ distanceUnit: "km" });
  });
});
