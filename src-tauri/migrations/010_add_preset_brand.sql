-- Add brand field to film_presets table
ALTER TABLE film_presets ADD COLUMN brand TEXT;

-- Drop short_name column if it exists
-- First check if short_name column exists by trying to query it
-- If the column doesn't exist, this will be a no-op
DROP TABLE IF EXISTS film_presets_temp;
CREATE TABLE film_presets_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    iso INTEGER NOT NULL,
    format TEXT NOT NULL,
    brand_color TEXT NOT NULL,
    image_path TEXT,
    brand TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table to new table
-- Only copy columns that exist in both tables
INSERT INTO film_presets_temp (id, name, iso, format, brand_color, image_path, brand, created_at)
SELECT id, name, iso, format, brand_color, image_path, COALESCE(brand, name), created_at FROM film_presets;

-- Drop old table and rename temp table
DROP TABLE film_presets;
ALTER TABLE film_presets_temp RENAME TO film_presets;
