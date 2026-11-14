import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openDatabase } from "../src/db/database.js";
import { runMigrations } from "../src/db/migrate.js";

describe("runMigrations", () => {
  it("creates the trips table and applies each migration once", () => {
    const db = openDatabase(":memory:");

    expect(runMigrations(db)).toEqual(["001_create_trips.sql", "002_create_user_settings.sql"]);
    expect(runMigrations(db)).toEqual([]);

    const columns = db.prepare("PRAGMA table_info(trips)").all().map((c) => c.name);
    expect(columns).toEqual(["id", "date", "origin", "destination", "distance", "purpose", "created_at", "updated_at"]);
  });

  it("creates the user_settings table, which accepts only mi or km and a single account row", () => {
    const db = openDatabase(":memory:");
    runMigrations(db);

    const columns = db.prepare("PRAGMA table_info(user_settings)").all().map((c) => c.name);
    expect(columns).toEqual(["id", "distance_unit", "updated_at"]);
    db.prepare("INSERT INTO user_settings (id) VALUES (1)").run();
    expect(db.prepare("SELECT distance_unit FROM user_settings").get()?.distance_unit).toBe("mi");
    expect(() => db.prepare("UPDATE user_settings SET distance_unit = 'yd'").run()).toThrow();
    expect(() => db.prepare("INSERT INTO user_settings (id, distance_unit) VALUES (2, 'km')").run()).toThrow();
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
