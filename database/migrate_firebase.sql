-- Migration: Add Firebase auth columns to users table
-- Run this once against the Aiven MySQL instance

ALTER TABLE users
  ADD COLUMN firebase_uid  VARCHAR(128) NULL AFTER id,
  ADD COLUMN avatar_url    TEXT         NULL AFTER email,
  ADD COLUMN last_seen_at  TIMESTAMP    NULL AFTER created_at;

-- Make password_hash nullable (Firebase users have no local password hash)
ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(255) NULL DEFAULT NULL;

-- Unique index for firebase_uid lookups
ALTER TABLE users
  ADD UNIQUE INDEX idx_firebase_uid (firebase_uid);

-- Verify
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'bware_ai' AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
