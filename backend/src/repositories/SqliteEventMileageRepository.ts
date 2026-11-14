import type { DatabaseSync } from "node:sqlite";
import type { EventMileage } from "../models/EventMileage.js";
import type { EventMileageRepository } from "./EventMileageRepository.js";

type Row = Record<string, unknown>;

/** Stores event mileage in the SQLite `event_mileage` table created by the versioned migrations. */
export class SqliteEventMileageRepository implements EventMileageRepository {
  constructor(private readonly db: DatabaseSync) {}

  async findByEventIds(userId: string, eventIds: string[]): Promise<Map<string, EventMileage>> {
    const found = new Map<string, EventMileage>();
    if (eventIds.length === 0) return found;
    const rows = this.db
      .prepare(
        `SELECT event_id, base_address, location, distance_meters FROM event_mileage
         WHERE google_user_id = ? AND event_id IN (SELECT value FROM json_each(?))`,
      )
      .all(userId, JSON.stringify(eventIds));
    for (const row of rows) found.set(String(row.event_id), toMileage(row));
    return found;
  }

  async saveAll(userId: string, mileages: EventMileage[]): Promise<void> {
    const insert = this.db.prepare(
      `INSERT INTO event_mileage (google_user_id, event_id, base_address, location, distance_meters)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (google_user_id, event_id) DO UPDATE
       SET base_address = excluded.base_address, location = excluded.location,
           distance_meters = excluded.distance_meters,
           calculated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    );
    this.db.exec("BEGIN");
    try {
      for (const m of mileages) insert.run(userId, m.eventId, m.baseAddress, m.location, m.distanceMeters);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

function toMileage(row: Row): EventMileage {
  return {
    eventId: String(row.event_id),
    baseAddress: String(row.base_address),
    location: String(row.location),
    distanceMeters: row.distance_meters === null ? null : Number(row.distance_meters),
  };
}
