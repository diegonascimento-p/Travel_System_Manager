-- Profile settings per Google account (identified by the account's primary calendar id, its email).
CREATE TABLE user_profiles (
  google_user_id TEXT PRIMARY KEY,
  -- Reference point for event mileage; NULL until the user saves one.
  base_address TEXT CHECK (base_address IS NULL OR length(trim(base_address)) > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
