-- The unit the user's distances are shown in. Distances stay stored in meters or miles; only display converts.
ALTER TABLE user_profiles
  ADD COLUMN distance_unit TEXT NOT NULL DEFAULT 'miles' CHECK (distance_unit IN ('miles', 'kilometers'));
