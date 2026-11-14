import type { DatabaseSync } from "node:sqlite";
import type { Trip, TripInput, TripPage } from "../models/Trip.js";
import type { TripRepository } from "./TripRepository.js";

const TRIP_COLUMNS = "id, date, origin, destination, distance, purpose";

type Row = Record<string, unknown>;

/** Stores trips in the SQLite `trips` table created by the versioned migrations. */
export class SqliteTripRepository implements TripRepository {
  constructor(private readonly db: DatabaseSync) {}

  async list(limit: number, offset: number): Promise<TripPage> {
    const rows = this.db
      .prepare(`SELECT ${TRIP_COLUMNS} FROM trips ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`)
      .all(limit, offset);
    const { total } = this.db.prepare("SELECT COUNT(*) AS total FROM trips").get() as Row;
    return { trips: rows.map(toTrip), total: Number(total) };
  }

  async findById(id: number): Promise<Trip | null> {
    const row = this.db.prepare(`SELECT ${TRIP_COLUMNS} FROM trips WHERE id = ?`).get(id);
    return row ? toTrip(row) : null;
  }

  async create(input: TripInput): Promise<Trip> {
    const row = this.db
      .prepare(
        `INSERT INTO trips (date, origin, destination, distance, purpose)
         VALUES (?, ?, ?, ?, ?) RETURNING ${TRIP_COLUMNS}`,
      )
      .get(input.date, input.origin, input.destination, input.distance, input.purpose);
    return toTrip(row!);
  }

  async update(id: number, input: TripInput): Promise<Trip | null> {
    const row = this.db
      .prepare(
        `UPDATE trips
         SET date = ?, origin = ?, destination = ?, distance = ?, purpose = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? RETURNING ${TRIP_COLUMNS}`,
      )
      .get(input.date, input.origin, input.destination, input.distance, input.purpose, id);
    return row ? toTrip(row) : null;
  }

  async summarizeBetween(from: string, to: string): Promise<{ totalDistance: number; tripCount: number }> {
    const row = this.db
      .prepare(
        "SELECT COALESCE(SUM(distance), 0) AS total, COUNT(*) AS count FROM trips WHERE date BETWEEN ? AND ?",
      )
      .get(from, to) as Row;
    return { totalDistance: Number(row.total), tripCount: Number(row.count) };
  }
}

function toTrip(row: Row): Trip {
  return {
    id: Number(row.id),
    date: String(row.date),
    origin: String(row.origin),
    destination: String(row.destination),
    distance: Number(row.distance),
    purpose: String(row.purpose),
  };
}
