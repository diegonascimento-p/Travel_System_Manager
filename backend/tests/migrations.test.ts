import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openDatabase } from "../src/db/database.js";
import { runMigrations } from "../src/db/migrate.js";

describe("runMigrations", () => {
  it("creates the trips table and applies each migration once", () => {
    const db = openDatabase(":memory:");

    expect(runMigrations(db)).toEqual(["001_create_trips.sql"]);
    expect(runMigrations(db)).toEqual([]);

    const columns = db.prepare("PRAGMA table_info(trips)").all().map((c) => c.name);
    expect(columns).toEqual(["id", "date", "origin", "destination", "distance", "purpose", "created_at", "updated_at"]);
  });

  it("applies migrations in version order and rolls back a failing one", () => {
    const dir = mkdtempSync(join(tmpdir(), "migrations-"));
    writeFileSync(join(dir, "002_second.sql"), "CREATE TABLE second (id INTEGER); INSERT INTO nope VALUES (1);");
    writeFileSync(join(dir, "001_first.sql"), "CREATE TABLE first (id INTEGER);");
    const db = openDatabase(":memory:");

    expect(() => runMigrations(db, dir)).toThrow();

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    expect(tables.map((t) => t.name)).toEqual(["first", "schema_migrations"]);
    const versions = db.prepare("SELECT version FROM schema_migrations").all().map((r) => r.version);
    expect(versions).toEqual(["001_first.sql"]);
  });
});
