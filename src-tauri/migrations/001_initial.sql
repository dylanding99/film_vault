-- Rolls table: Core unit for film roll management
CREATE TABLE rolls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    film_stock TEXT NOT NULL,
    camera TEXT NOT NULL,
    lens TEXT,
    shoot_date TEXT NOT NULL,
    lab_info TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Photos table: Individual photos within rolls
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    preview_path TEXT,
    rating INTEGER DEFAULT 0,
    is_cover BOOLEAN DEFAULT 0,
    lat REAL,
    lon REAL,
    exif_synced BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_id) REFERENCES rolls(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_photos_roll_id ON photos(roll_id);
CREATE INDEX idx_photos_is_cover ON photos(is_cover);
CREATE INDEX idx_photos_rating ON photos(rating);
