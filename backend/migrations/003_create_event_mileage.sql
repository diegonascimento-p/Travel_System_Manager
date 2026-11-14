-- Round-trip mileage calculated for a user's calendar events, stored in meters.
-- base_address and location record the inputs, so the mileage is recalculated when either changes.
CREATE TABLE event_mileage (
  google_user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  base_address TEXT NOT NULL,
  location TEXT NOT NULL,
  -- NULL when Google Maps could not find or route to the location.
  distance_meters REAL CHECK (distance_meters IS NULL OR distance_meters >= 0),
  calculated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (google_user_id, event_id)
);
