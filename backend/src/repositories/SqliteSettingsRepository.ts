import type { DatabaseSync } from "node:sqlite";
import type { DistanceUnit, UserSettings } from "../models/Settings.js";
import type { SettingsRepository } from "./SettingsRepository.js";

const ACCOUNT_ID = 1;

/** Stores the account's settings in the single-row SQLite `user_settings` table. */
export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly db: DatabaseSync) {}

  async find(): Promise<UserSettings | null> {
    const row = this.db.prepare("SELECT distance_unit FROM user_settings WHERE id = ?").get(ACCOUNT_ID);
    return row ? { distanceUnit: row.distance_unit as DistanceUnit } : null;
  }

  async save(settings: UserSettings): Promise<UserSettings> {
    this.db
      .prepare(
        `INSERT INTO user_settings (id, distance_unit) VALUES (?, ?)
         ON CONFLICT (id) DO UPDATE SET distance_unit = excluded.distance_unit,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      )
      .run(ACCOUNT_ID, settings.distanceUnit);
    return settings;
  }
}
