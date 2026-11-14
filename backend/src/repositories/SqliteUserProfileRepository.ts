import type { DatabaseSync } from "node:sqlite";
import type { UserProfile } from "../models/UserProfile.js";
import type { UserProfileRepository } from "./UserProfileRepository.js";

type Row = Record<string, unknown>;

/** Stores profiles in the SQLite `user_profiles` table created by the versioned migrations. */
export class SqliteUserProfileRepository implements UserProfileRepository {
  constructor(private readonly db: DatabaseSync) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const row = this.db.prepare("SELECT base_address FROM user_profiles WHERE google_user_id = ?").get(userId);
    return row ? toProfile(row) : null;
  }

  async save(userId: string, profile: UserProfile): Promise<UserProfile> {
    const row = this.db
      .prepare(
        `INSERT INTO user_profiles (google_user_id, base_address) VALUES (?, ?)
         ON CONFLICT (google_user_id) DO UPDATE
         SET base_address = excluded.base_address, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         RETURNING base_address`,
      )
      .get(userId, profile.baseAddress);
    return toProfile(row!);
  }
}

function toProfile(row: Row): UserProfile {
  return { baseAddress: row.base_address === null ? null : String(row.base_address) };
}
