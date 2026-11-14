import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSync } from "node:sqlite";

/** Folder holding the versioned SQL migrations (`NNN_description.sql`), applied in name order. */
export const MIGRATIONS_DIR = fileURLToPath(new URL("../../migrations", import.meta.url));

const MIGRATION_FILE = /^\d+_[\w-]+\.sql$/;

/** Applies every migration not yet recorded in `schema_migrations`, each in its own transaction. */
export function runMigrations(db: DatabaseSync, dir: string = MIGRATIONS_DIR): string[] {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const applied = new Set(
    db.prepare("SELECT version FROM schema_migrations").all().map((row) => String(row.version)),
  );
  const pending = pendingMigrations(dir, applied);
  for (const file of pending) applyMigration(db, file, readFileSync(join(dir, file), "utf8"));
  return pending;
}

function pendingMigrations(dir: string, applied: Set<string>): string[] {
  return readdirSync(dir)
    .filter((file) => MIGRATION_FILE.test(file) && !applied.has(file))
    .sort();
}

function applyMigration(db: DatabaseSync, version: string, sql: string): void {
  db.exec("BEGIN");
  try {
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(
      version,
      new Date().toISOString(),
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
