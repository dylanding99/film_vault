-- Migration 005: Add EXIF and UI settings
-- Adds fields for EXIF auto-write configuration and UI preferences

-- Add EXIF auto-write setting (default: true)
-- When true, automatically writes EXIF to photos during import and when editing roll metadata
ALTER TABLE settings ADD COLUMN exif_auto_write INTEGER DEFAULT 1;

-- Add grid columns setting (default: 4)
-- Controls the number of columns in the photo grid (2-6)
ALTER TABLE settings ADD COLUMN grid_columns INTEGER DEFAULT 4;

-- Add concurrent EXIF writes setting (default: 4)
-- Controls the number of concurrent EXIF write operations (1-8)
ALTER TABLE settings ADD COLUMN exif_concurrent_writes INTEGER DEFAULT 4;
