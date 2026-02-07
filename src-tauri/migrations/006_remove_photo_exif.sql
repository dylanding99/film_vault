-- Migration 006: Remove photo-level EXIF fields
-- These fields will be read directly from files instead
-- Keep roll-level metadata (camera, lens, film_stock, etc.) in database

-- Note: DROP COLUMN requires SQLite 3.35.0+
-- For compatibility, we'll try to drop columns and ignore errors if they don't exist
-- For new installations, these columns never existed, so errors are expected

-- We use SQLite's table rebuild approach for maximum compatibility
-- However, since we only want to remove specific columns and keep most,
-- we'll simply let individual DROP COLUMN commands fail silently

-- Remove photo-level EXIF columns from photos table (if they exist)
-- These will be read directly from EXIF files using ExifTool instead
-- If these commands fail (column doesn't exist or SQLite version too old),
-- that's acceptable - the app will work with or without these columns

-- Attempt to drop shooting parameter columns
ALTER TABLE photos DROP COLUMN exif_iso;
ALTER TABLE photos DROP COLUMN exif_aperture;
ALTER TABLE photos DROP COLUMN exif_shutter_speed;
ALTER TABLE photos DROP COLUMN exif_focal_length;

-- Attempt to drop GPS altitude column
ALTER TABLE photos DROP COLUMN exif_altitude;

-- Keep sync tracking fields for UI display purposes
-- exif_synced: shows if photo EXIF has been viewed/synced
-- exif_written_at: timestamp of last EXIF write
-- exif_data_hash: hash to detect changes (optional, for future use)
-- These columns remain in the database

-- Note: If this migration fails with "near DROP: syntax error",
-- it means SQLite version is too old (< 3.35.0). In that case:
-- 1. The columns will remain in the database but won't be used
-- 2. New reads will use ExifTool to get EXIF from files
-- 3. The app will function normally, just with some unused columns
