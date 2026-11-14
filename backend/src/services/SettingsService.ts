import type { UserSettings } from "../models/Settings.js";
import type { SettingsRepository } from "../repositories/SettingsRepository.js";
import { DEFAULT_SETTINGS, validateSettingsInput } from "./settingsRules.js";

/** The request was invalid; `fields` holds a message per invalid setting. */
export class SettingsValidationError extends Error {
  constructor(readonly fields: Record<string, string>) {
    super("The settings are invalid");
  }
}

export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  /** The saved settings, or the defaults when none were saved. */
  async getSettings(): Promise<UserSettings> {
    return (await this.settings.find()) ?? DEFAULT_SETTINGS;
  }

  async saveSettings(raw: unknown): Promise<UserSettings> {
    const result = validateSettingsInput(raw);
    if (!result.ok) throw new SettingsValidationError(result.errors);
    return this.settings.save(result.value);
  }
}
