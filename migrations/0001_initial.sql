-- D1 schema placeholder for the first persistent game data slice.
-- Keep the MVP local-first until the account/database scope is confirmed.
CREATE TABLE IF NOT EXISTS save_slots (
  id TEXT PRIMARY KEY,
  save_version INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
