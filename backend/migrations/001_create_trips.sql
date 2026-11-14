-- Trips logged by the user for mileage tracking. Distances are stored in miles.
CREATE TABLE trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance REAL NOT NULL CHECK (distance > 0),
  purpose TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX trips_date_idx ON trips (date DESC, id DESC);
