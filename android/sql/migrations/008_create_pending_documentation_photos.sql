CREATE TABLE IF NOT EXISTS pending_documentation_photos (
  id                    TEXT    NOT NULL PRIMARY KEY,
  image_data            TEXT    NOT NULL,
  image_type            TEXT    NOT NULL,
  image_name            TEXT    NOT NULL,
  location              TEXT,
  location_latitude     REAL,
  location_longitude    REAL,
  stall_number          TEXT,
  captured_at            TEXT    NOT NULL,
  queued_at             TEXT    NOT NULL,
  user_id               TEXT    NOT NULL,
  sync_status           TEXT    NOT NULL DEFAULT 'pending',
  sync_attempts         INTEGER NOT NULL DEFAULT 0,
  last_synced_at        TEXT,
  last_sync_error       TEXT,
  created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_pending_documentation_photos_sync_status_queued_at
  ON pending_documentation_photos (sync_status, queued_at ASC);

CREATE INDEX IF NOT EXISTS idx_pending_documentation_photos_user_id
  ON pending_documentation_photos (user_id);
