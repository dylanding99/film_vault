-- Add is_favorite column to photos table
ALTER TABLE photos ADD COLUMN is_favorite BOOLEAN DEFAULT 0;

-- Create index for favorite queries
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);
