import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openDatabase } from "../src/db/database.js";
import { runMigrations } from "../src/db/migrate.js";

describe("runMigrations", () => {
  it("creates the trips, user profile and event mileage tables and applies each migration once", () => {
    const db = openDatabase(":memory:");

    expect(runMigrations(db)).toEqual([
      "001_create_trips.sql",
      "002_create_user_profiles.sql",
      "003_create_event_mileage.sql",
      "004_add_distance_unit_to_user_profiles.sql",
    ]);
    expect(runMigrations(db)).toEqual([]);

    const columns = db.prepare("PRAGMA table_info(trips)").all().map((c) => c.name);
    expect(columns).toEqual(["id", "date", "origin", "destination", "distance", "purpose", "created_at", "updated_at"]);
    const profileColumns = db.prepare("PRAGMA table_info(user_profiles)").all().map((c) => c.name);
    expect(profileColumns).toEqual(["google_user_id", "base_address", "created_at", "updated_at", "distance_unit"]);
    const mileageColumns = db.prepare("PRAGMA table_info(event_mileage)").all().map((c) => c.name);
    expect(mileageColumns).toEqual(["google_user_id", "event_id", "base_address", "location", "distance_meters", "calculated_at"]);
  });

  it("defaults a profile's distance unit to miles and accepts only miles or kilometers", () => {
    const db = openDatabase(":memory:");
    runMigrations(db);

    db.prepare("INSERT INTO user_profiles (google_user_id) VALUES ('alice')").run();
    expect(db.prepare("SELECT distance_unit FROM user_profiles").get()?.distance_unit).toBe("miles");
    db.prepare("UPDATE user_profiles SET distance_unit = 'kilometers'").run();
    expect(() => db.prepare("UPDATE user_profiles SET distance_unit = 'yards'").run()).toThrow();
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
