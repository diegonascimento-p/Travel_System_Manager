import { openDatabase } from "../src/db/database.js";
import { runMigrations } from "../src/db/migrate.js";
import { SqliteSettingsRepository } from "../src/repositories/SqliteSettingsRepository.js";
import { SqliteTripRepository } from "../src/repositories/SqliteTripRepository.js";

/** A trip repository backed by a fresh in-memory SQLite database with every migration applied. */
export function migratedTripRepository(): SqliteTripRepository {
  const db = openDatabase(":memory:");
  runMigrations(db);
  return new SqliteTripRepository(db);
}

/** A settings repository backed by a fresh in-memory SQLite database with every migration applied. */
export function migratedSettingsRepository(): SqliteSettingsRepository {
  const db = openDatabase(":memory:");
  runMigrations(db);
  return new SqliteSettingsRepository(db);
}
