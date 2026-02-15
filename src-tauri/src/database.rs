use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use anyhow::Result;
use anyhow::anyhow;

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Roll {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub film_stock: String,
    pub camera: String,
    pub lens: Option<String>,
    pub shoot_date: String,
    pub lab_info: Option<String>,
    pub notes: Option<String>,
    pub city: Option<String>,
    pub country: Option<String>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Photo {
    pub id: i64,
    pub roll_id: i64,
    pub filename: String,
    pub file_path: String,
    pub thumbnail_path: Option<String>,
    pub preview_path: Option<String>,
    pub rating: i32,
    pub is_cover: bool,
    pub is_favorite: bool,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub city: Option<String>,
    pub country: Option<String>,
    pub exif_synced: bool,
    pub created_at: String,
    // EXIF write tracking fields
    pub exif_written_at: Option<String>,
    pub exif_data_hash: Option<String>,
    // User-editable metadata (stored in database, not EXIF)
    pub exif_user_comment: Option<String>,
    pub exif_description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewRoll {
    pub name: String,
    pub path: String,
    pub film_stock: String,
    pub camera: String,
    pub lens: Option<String>,
    pub shoot_date: String,
    pub lab_info: Option<String>,
    pub notes: Option<String>,
    pub city: Option<String>,
    pub country: Option<String>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewPhoto {
    pub roll_id: i64,
    pub filename: String,
    pub file_path: String,
    pub thumbnail_path: Option<String>,
    pub preview_path: Option<String>,
}

/// Initialize database connection and run migrations
pub async fn init_database(db_path: &str) -> Result<SqlitePool> {
    eprintln!("[DB] Connecting to database: {}", db_path);
    let pool = SqlitePool::connect(db_path).await?;
    eprintln!("[DB] Connected successfully");

    // Run migrations
    eprintln!("[DB] Running migrations...");

    // Migration 001: Initial schema
    let migration_001 = include_str!("../migrations/001_initial.sql");
    match sqlx::query(migration_001).execute(&pool).await {
        Ok(_) => eprintln!("[DB] Migration 001 executed successfully"),
        Err(e) => {
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("already exists") {
                eprintln!("[DB] Migration 001: Tables already exist, skipping");
            } else {
                eprintln!("[DB] Migration 001 error: {}", e);
                return Err(e.into());
            }
        }
    }

    // Migration 002: Settings table
    let migration_002 = include_str!("../migrations/002_settings.sql");
    match sqlx::query(migration_002).execute(&pool).await {
        Ok(_) => eprintln!("[DB] Migration 002 executed successfully"),
        Err(e) => {
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("already exists") {
                eprintln!("[DB] Migration 002: Settings table already exist, skipping");
            } else {
                eprintln!("[DB] Migration 002 error: {}", e);
                return Err(e.into());
            }
        }
    }

    // Migration 003: Add is_favorite column to photos
    let migration_003 = include_str!("../migrations/003_add_photo_favorite.sql");
    match sqlx::query(migration_003).execute(&pool).await {
        Ok(_) => eprintln!("[DB] Migration 003 executed successfully"),
        Err(e) => {
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("duplicate column") {
                eprintln!("[DB] Migration 003: is_favorite column already exists, skipping");
            } else {
                eprintln!("[DB] Migration 003 error: {}", e);
                return Err(e.into());
            }
        }
    }

    // Migration 004: Add EXIF write tracking and photo-level EXIF fields
    let migration_004 = include_str!("../migrations/004_exif_write_tracking.sql");
    match sqlx::query(migration_004).execute(&pool).await {
        Ok(_) => eprintln!("[DB] Migration 004 executed successfully"),
        Err(e) => {
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("duplicate column") {
                eprintln!("[DB] Migration 004: EXIF columns already exist, skipping");
            } else {
                eprintln!("[DB] Migration 004 error: {}", e);
                return Err(e.into());
            }
        }
    }

    // Migration 005: Add EXIF and UI settings
    let migration_005 = include_str!("../migrations/005_settings_exif.sql");
    match sqlx::query(migration_005).execute(&pool).await {
        Ok(_) => eprintln!("[DB] Migration 005 executed successfully"),
        Err(e) => {
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("duplicate column") {
                eprintln!("[DB] Migration 005: Settings columns already exist, skipping");
            } else {
                eprintln!("[DB] Migration 005 error: {}", e);
                return Err(e.into());
            }
        }
    }

    // Migration 006: Remove photo-level EXIF fields
    // Note: DROP COLUMN requires SQLite 3.35.0+. If it fails, the app will still work
    // - Columns remain in DB but won't be used (EXIF read from files instead)
    // - New installations: columns never existed, error is acceptable
    // - Old SQLite: DROP COLUMN not supported, columns remain but unused
    //
    // Execute each DROP COLUMN separately since sqlx::query only handles one statement
    let drop_columns = vec![
        "ALTER TABLE photos DROP COLUMN exif_iso",
        "ALTER TABLE photos DROP COLUMN exif_aperture",
        "ALTER TABLE photos DROP COLUMN exif_shutter_speed",
        "ALTER TABLE photos DROP COLUMN exif_focal_length",
        "ALTER TABLE photos DROP COLUMN exif_altitude",
    ];

    let mut migration_006_success = true;
    for drop_stmt in drop_columns {
        match sqlx::query(drop_stmt).execute(&pool).await {
            Ok(_) => {
                eprintln!("[DB] Migration 006: Executed {}", drop_stmt);
            }
            Err(e) => {
                let error_msg = e.to_string().to_lowercase();
                // Ignore errors related to:
                // - Columns not existing ("no such column")
                // - SQLite version too old ("near drop", "syntax error")
                // - Duplicate operations ("duplicate")
                if error_msg.contains("no such column")
                    || error_msg.contains("near drop")
                    || error_msg.contains("syntax error")
                    || error_msg.contains("duplicate") {
                    eprintln!("[DB] Migration 006: Skipped {} (column doesn't exist or SQLite version too old)", drop_stmt);
                    migration_006_success = false;
                } else {
                    eprintln!("[DB] Migration 006 error on '{}': {}", drop_stmt, e);
                    return Err(e.into());
                }
            }
        }
    }

    if migration_006_success {
        eprintln!("[DB] Migration 006 executed successfully");
    } else {
        eprintln!("[DB] Migration 006: Partial execution (some columns didn't exist or SQLite version too old)");
        eprintln!("[DB] Note: App will function normally - EXIF will be read from files");
    }

    // Migration 007: Add city and country to photos table
    let migration_007 = include_str!("../migrations/007_add_photo_city.sql");
    match sqlx::query(migration_007).execute(&pool).await {
        Ok(_) => eprintln!("[DB] Migration 007 executed successfully"),
        Err(e) => {
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("duplicate column") {
                eprintln!("[DB] Migration 007: city/country columns already exist, skipping");
            } else {
                eprintln!("[DB] Migration 007 error: {}", e);
                return Err(e.into());
            }
        }
    }

    // Migration 008: Add location fields to rolls table
    let migration_008 = include_str!("../migrations/008_add_roll_location.sql");
    match sqlx::query(migration_008).execute(&pool).await {
        Ok(_) => eprintln!("[DB] Migration 008 executed successfully"),
        Err(e) => {
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("duplicate column") {
                eprintln!("[DB] Migration 008: location columns already exist, skipping");
            } else {
                eprintln!("[DB] Migration 008 error: {}", e);
                return Err(e.into());
            }
        }
    }

    eprintln!("[DB] All migrations completed");
    Ok(pool)
}

/// Create a new roll
pub async fn create_roll(pool: &SqlitePool, roll: NewRoll) -> Result<i64> {
    let result = sqlx::query(
        r#"
        INSERT INTO rolls (name, path, film_stock, camera, lens, shoot_date, lab_info, notes)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#
    )
    .bind(&roll.name)
    .bind(&roll.path)
    .bind(&roll.film_stock)
    .bind(&roll.camera)
    .bind(&roll.lens)
    .bind(&roll.shoot_date)
    .bind(&roll.lab_info)
    .bind(&roll.notes)
    .execute(pool)
    .await?;

    Ok(result.last_insert_rowid())
}

/// Get all rolls
pub async fn get_all_rolls(pool: &SqlitePool) -> Result<Vec<Roll>> {
    let rolls = sqlx::query_as::<_, Roll>(
        "SELECT id, name, path, film_stock, camera, lens, shoot_date, lab_info, notes, city, country, lat, lon, created_at, updated_at FROM rolls ORDER BY shoot_date DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(rolls)
}

/// Get roll by ID
pub async fn get_roll_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Roll>> {
    let roll = sqlx::query_as::<_, Roll>(
        "SELECT id, name, path, film_stock, camera, lens, shoot_date, lab_info, notes, city, country, lat, lon, created_at, updated_at FROM rolls WHERE id = ?1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(roll)
}

/// Update roll metadata (including location)
pub async fn update_roll(pool: &SqlitePool, id: i64, roll: NewRoll) -> Result<bool> {
    let result = sqlx::query(
        r#"
        UPDATE rolls
        SET name = ?1, film_stock = ?2, camera = ?3, lens = ?4,
            shoot_date = ?5, lab_info = ?6, notes = ?7,
            city = ?8, country = ?9, lat = ?10, lon = ?11,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?12
        "#
    )
    .bind(&roll.name)
    .bind(&roll.film_stock)
    .bind(&roll.camera)
    .bind(&roll.lens)
    .bind(&roll.shoot_date)
    .bind(&roll.lab_info)
    .bind(&roll.notes)
    .bind(&roll.city)
    .bind(&roll.country)
    .bind(roll.lat)
    .bind(roll.lon)
    .bind(id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

/// Delete roll
pub async fn delete_roll(pool: &SqlitePool, id: i64) -> Result<bool> {
    let result = sqlx::query("DELETE FROM rolls WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

/// Create a new photo
pub async fn create_photo(pool: &SqlitePool, photo: NewPhoto) -> Result<i64> {
    let result = sqlx::query(
        r#"
        INSERT INTO photos (roll_id, filename, file_path, thumbnail_path, preview_path)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#
    )
    .bind(photo.roll_id)
    .bind(&photo.filename)
    .bind(&photo.file_path)
    .bind(&photo.thumbnail_path)
    .bind(&photo.preview_path)
    .execute(pool)
    .await?;

    Ok(result.last_insert_rowid())
}

/// Batch create photos
pub async fn create_photos(pool: &SqlitePool, photos: Vec<NewPhoto>) -> Result<Vec<i64>> {
    let mut ids = Vec::new();

    for photo in photos {
        let id = create_photo(pool, photo).await?;
        ids.push(id);
    }

    Ok(ids)
}

/// Get photos by roll ID
pub async fn get_photos_by_roll(pool: &SqlitePool, roll_id: i64) -> Result<Vec<Photo>> {
    let photos = sqlx::query_as::<_, Photo>(
        "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, is_favorite, lat, lon, city, country, exif_synced, created_at, exif_written_at, exif_data_hash, exif_user_comment, exif_description FROM photos WHERE roll_id = ?1 ORDER BY filename"
    )
    .bind(roll_id)
    .fetch_all(pool)
    .await?;

    Ok(photos)
}

/// Get a single photo by ID
pub async fn get_photo_by_id(pool: &SqlitePool, photo_id: i64) -> Result<Option<Photo>> {
    let photo = sqlx::query_as::<_, Photo>(
        "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, is_favorite, lat, lon, city, country, exif_synced, created_at, exif_written_at, exif_data_hash, exif_user_comment, exif_description FROM photos WHERE id = ?1"
    )
    .bind(photo_id)
    .fetch_optional(pool)
    .await?;

    Ok(photo)
}

/// Get cover photo for a roll
pub async fn get_roll_cover(pool: &SqlitePool, roll_id: i64) -> Result<Option<Photo>> {
    let photo = sqlx::query_as::<_, Photo>(
        "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, is_favorite, lat, lon, city, country, exif_synced, created_at, exif_written_at, exif_data_hash, exif_user_comment, exif_description FROM photos WHERE roll_id = ?1 AND is_cover = 1 LIMIT 1"
    )
    .bind(roll_id)
    .fetch_optional(pool)
    .await?;

    Ok(photo)
}

/// Set photo as cover
pub async fn set_photo_as_cover(pool: &SqlitePool, roll_id: i64, photo_id: i64) -> Result<bool> {
    // First, remove cover status from all photos in the roll
    sqlx::query("UPDATE photos SET is_cover = 0 WHERE roll_id = ?1")
        .bind(roll_id)
        .execute(pool)
        .await?;

    // Then, set the new cover
    let result = sqlx::query("UPDATE photos SET is_cover = 1 WHERE id = ?2 AND roll_id = ?1")
        .bind(roll_id)
        .bind(photo_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

/// Update photo rating
pub async fn update_photo_rating(pool: &SqlitePool, photo_id: i64, rating: i32) -> Result<bool> {
    let result = sqlx::query("UPDATE photos SET rating = ?1 WHERE id = ?2")
        .bind(rating)
        .bind(photo_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

/// Update photo location
pub async fn update_photo_location(
    pool: &SqlitePool,
    photo_id: i64,
    lat: f64,
    lon: f64,
) -> Result<bool> {
    let result = sqlx::query("UPDATE photos SET lat = ?1, lon = ?2 WHERE id = ?3")
        .bind(lat)
        .bind(lon)
        .bind(photo_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

/// Delete a single photo by ID
pub async fn delete_photo(pool: &SqlitePool, photo_id: i64) -> Result<bool> {
    let result = sqlx::query("DELETE FROM photos WHERE id = ?1")
        .bind(photo_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

/// Batch delete photos by IDs
/// If cover photos are deleted, automatically sets new cover (first remaining photo)
pub async fn delete_photos(pool: &SqlitePool, photo_ids: Vec<i64>) -> Result<usize> {
    if photo_ids.is_empty() {
        return Ok(0);
    }

    // Build placeholder string: ?, ?, ?, ...
    let placeholders = photo_ids.iter()
        .enumerate()
        .map(|(i, _)| format!("?{}", i + 1))
        .collect::<Vec<_>>()
        .join(", ");

    // Before deleting, check which photos are covers and get their roll IDs
    let select_query = format!("SELECT id, roll_id, is_cover FROM photos WHERE id IN ({})", placeholders);
    let mut select_builder = sqlx::query_as::<_, (i64, i64, bool)>(&select_query);
    for photo_id in &photo_ids {
        select_builder = select_builder.bind(photo_id);
    }
    let ids_with_rolls = select_builder.fetch_all(pool).await?;

    // Collect roll IDs that had their cover deleted
    let mut affected_rolls: std::collections::HashSet<i64> = std::collections::HashSet::new();
    for (_, roll_id, is_cover) in &ids_with_rolls {
        if *is_cover {
            affected_rolls.insert(*roll_id);
        }
    }

    let query = format!("DELETE FROM photos WHERE id IN ({})", placeholders);

    let mut query_builder = sqlx::query(&query);
    for photo_id in &photo_ids {
        query_builder = query_builder.bind(photo_id);
    }

    let result = query_builder.execute(pool).await?;

    // If any cover photos were deleted, set new covers for affected rolls
    if !affected_rolls.is_empty() {
        for roll_id in affected_rolls {
            // Set the first remaining photo as cover
            if let Some(first_photo) = sqlx::query_as::<_, Photo>(
                "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, is_favorite, lat, lon, city, country, exif_synced, created_at, exif_written_at, exif_data_hash, exif_user_comment, exif_description FROM photos WHERE roll_id = ?1 ORDER BY id LIMIT 1"
            )
            .bind(roll_id)
            .fetch_optional(pool)
            .await?
            {
                // Found a photo to set as cover
                let _ = sqlx::query("UPDATE photos SET is_cover = 1 WHERE id = ?1")
                    .bind(first_photo.id)
                    .execute(pool)
                    .await?;
                eprintln!("[DeletePhotos] Set new cover {} for roll {}", first_photo.id, roll_id);
            } else {
                eprintln!("[DeletePhotos] Roll {} has no photos left after deletion", roll_id);
            }
        }
    }

    Ok(result.rows_affected() as usize)
}

/// Toggle photo favorite status
pub async fn toggle_photo_favorite(pool: &SqlitePool, photo_id: i64) -> Result<bool> {
    // First get current status
    let current = sqlx::query_scalar::<_, bool>(
        "SELECT is_favorite FROM photos WHERE id = ?1"
    )
    .bind(photo_id)
    .fetch_optional(pool)
    .await?
    .unwrap_or(false);

    // Toggle the status
    let new_status = !current;
    let result = sqlx::query("UPDATE photos SET is_favorite = ?1 WHERE id = ?2")
        .bind(new_status)
        .bind(photo_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

/// Update photo favorite status
pub async fn update_photo_favorite(pool: &SqlitePool, photo_id: i64, is_favorite: bool) -> Result<bool> {
    let result = sqlx::query("UPDATE photos SET is_favorite = ?1 WHERE id = ?2")
        .bind(is_favorite)
        .bind(photo_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

/// Get favorite photos by roll ID
pub async fn get_favorite_photos_by_roll(pool: &SqlitePool, roll_id: i64) -> Result<Vec<Photo>> {
    let photos = sqlx::query_as::<_, Photo>(
        "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, is_favorite, lat, lon, city, country, exif_synced, created_at, exif_written_at, exif_data_hash, exif_user_comment, exif_description FROM photos WHERE roll_id = ?1 AND is_favorite = 1 ORDER BY filename"
    )
    .bind(roll_id)
    .fetch_all(pool)
    .await?;

    Ok(photos)
}

/// Update photo metadata (description, comment, sync status)
/// Only updates user-editable fields, not EXIF from files
pub async fn update_photo_metadata(
    pool: &SqlitePool,
    photo_id: i64,
    exif_user_comment: Option<String>,
    exif_description: Option<String>,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        UPDATE photos
        SET exif_user_comment = ?1,
            exif_description = ?2
        WHERE id = ?3
        "#
    )
    .bind(exif_user_comment)
    .bind(exif_description)
    .bind(photo_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

/// Update photo EXIF sync status after writing to file
pub async fn mark_photo_exif_synced(
    pool: &SqlitePool,
    photo_id: i64,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        UPDATE photos
        SET exif_synced = 1,
            exif_written_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#
    )
    .bind(photo_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

/// Update roll location (lat, lon, city, country)
pub async fn update_roll_location(
    pool: &SqlitePool,
    roll_id: i64,
    lat: Option<f64>,
    lon: Option<f64>,
    city: Option<String>,
    country: Option<String>,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        UPDATE rolls
        SET lat = ?1, lon = ?2, city = ?3, country = ?4, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?5
        "#
    )
    .bind(lat)
    .bind(lon)
    .bind(city)
    .bind(country)
    .bind(roll_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

/// Update photo location with city and country
pub async fn update_photo_location_with_city(
    pool: &SqlitePool,
    photo_id: i64,
    lat: Option<f64>,
    lon: Option<f64>,
    city: Option<String>,
    country: Option<String>,
) -> Result<bool> {
    let result = sqlx::query(
        r#"
        UPDATE photos
        SET lat = ?1, lon = ?2, city = ?3, country = ?4
        WHERE id = ?5
        "#
    )
    .bind(lat)
    .bind(lon)
    .bind(city)
    .bind(country)
    .bind(photo_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

/// Apply roll location to all photos in the roll
/// If location parameters are provided, use them; otherwise read from database
/// Only updates photos that don't have their own location (lat IS NULL or city IS NULL)
pub async fn apply_roll_location_to_photos(
    pool: &SqlitePool,
    roll_id: i64,
    lat: Option<f64>,
    lon: Option<f64>,
    city: Option<String>,
    country: Option<String>,
) -> Result<usize> {
    // If location parameters are not provided, read from database
    let (lat, lon, city, country) = if lat.is_none() || city.is_none() {
        let roll = get_roll_by_id(pool, roll_id).await?
            .ok_or_else(|| anyhow!("Roll {} not found", roll_id))?;
        (roll.lat, roll.lon, roll.city, roll.country)
    } else {
        (lat, lon, city, country)
    };

    // Update only photos that don't have their own location
    let result = sqlx::query(
        r#"
        UPDATE photos
        SET lat = ?1, lon = ?2, city = ?3, country = ?4
        WHERE roll_id = ?5
          AND (lat IS NULL OR lon IS NULL OR city IS NULL OR country IS NULL)
        "#
    )
    .bind(lat)
    .bind(lon)
    .bind(&city)
    .bind(&country)
    .bind(roll_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() as usize)
}
