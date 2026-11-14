-- Preferences of the app's user account. The app has a single account (trips are not scoped
-- to a user), so the table holds at most one row, with id 1.
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  distance_unit TEXT NOT NULL DEFAULT 'mi' CHECK (distance_unit IN ('mi', 'km')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
