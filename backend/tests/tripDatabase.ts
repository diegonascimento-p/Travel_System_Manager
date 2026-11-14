import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../src/db/database.js";
import { runMigrations } from "../src/db/migrate.js";
import { SqliteTripRepository } from "../src/repositories/SqliteTripRepository.js";

/** A fresh in-memory SQLite database with every migration applied. */
export function migratedDatabase(): DatabaseSync {
  const db = openDatabase(":memory:");
  runMigrations(db);
  return db;
}

/** A trip repository backed by a fresh in-memory SQLite database with every migration applied. */
export function migratedTripRepository(): SqliteTripRepository {
  return new SqliteTripRepository(migratedDatabase());
}
