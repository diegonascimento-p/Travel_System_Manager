import type { UserSettings } from "../models/Settings.js";

export interface SettingsRepository {
  /** The saved settings, or null when the user never saved any. */
  find(): Promise<UserSettings | null>;
  /** Saves the settings, replacing any saved before, and returns them. */
  save(settings: UserSettings): Promise<UserSettings>;
}
