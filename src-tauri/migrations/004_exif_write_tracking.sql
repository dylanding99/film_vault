-- Migration 004: Add EXIF write tracking and photo-level EXIF fields
-- This migration adds support for ExifTool bidirectional integration
-- Focus: EXIF writing functionality with tracking and photo-level metadata storage

-- EXIF write tracking
-- exif_written_at: Timestamp when EXIF was last written to the file
ALTER TABLE photos ADD COLUMN exif_written_at DATETIME;

-- exif_data_hash: Hash of roll metadata to detect changes and avoid redundant writes
ALTER TABLE photos ADD COLUMN exif_data_hash TEXT;

-- Photo-level EXIF fields (store in DB for search, bulk editing, and fallback)
-- Shooting parameters
ALTER TABLE photos ADD COLUMN exif_iso INTEGER;
ALTER TABLE photos ADD COLUMN exif_aperture TEXT;        -- e.g., "f/1.4"
ALTER TABLE photos ADD COLUMN exif_shutter_speed TEXT; -- e.g., "1/125"
ALTER TABLE photos ADD COLUMN exif_focal_length TEXT;    -- e.g., "50mm"

-- GPS data
ALTER TABLE photos ADD COLUMN exif_altitude REAL;       -- GPS altitude in meters

-- User comments
ALTER TABLE photos ADD COLUMN exif_user_comment TEXT;
ALTER TABLE photos ADD COLUMN exif_description TEXT;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_photos_exif_written ON photos(exif_written_at);
CREATE INDEX IF NOT EXISTS idx_photos_exif_synced ON photos(exif_synced);
