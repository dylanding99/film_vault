use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use anyhow::Result;

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
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub exif_synced: bool,
    pub created_at: String,
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
    let migration_sql = include_str!("../migrations/001_initial.sql");

    // Execute migration
    match sqlx::query(migration_sql).execute(&pool).await {
        Ok(_) => eprintln!("[DB] Migrations executed successfully"),
        Err(e) => {
            // If it's a "table already exists" error, that's okay
            let error_msg = e.to_string().to_lowercase();
            if error_msg.contains("already exists") {
                eprintln!("[DB] Tables already exist, skipping migration");
            } else {
                eprintln!("[DB] Migration error: {}", e);
                return Err(e.into());
            }
        }
    }

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
        "SELECT id, name, path, film_stock, camera, lens, shoot_date, lab_info, notes, created_at, updated_at FROM rolls ORDER BY shoot_date DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(rolls)
}

/// Get roll by ID
pub async fn get_roll_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Roll>> {
    let roll = sqlx::query_as::<_, Roll>(
        "SELECT id, name, path, film_stock, camera, lens, shoot_date, lab_info, notes, created_at, updated_at FROM rolls WHERE id = ?1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(roll)
}

/// Update roll metadata
pub async fn update_roll(pool: &SqlitePool, id: i64, roll: NewRoll) -> Result<bool> {
    let result = sqlx::query(
        r#"
        UPDATE rolls
        SET name = ?1, film_stock = ?2, camera = ?3, lens = ?4,
            shoot_date = ?5, lab_info = ?6, notes = ?7, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?8
        "#
    )
    .bind(&roll.name)
    .bind(&roll.film_stock)
    .bind(&roll.camera)
    .bind(&roll.lens)
    .bind(&roll.shoot_date)
    .bind(&roll.lab_info)
    .bind(&roll.notes)
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
        "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, lat, lon, exif_synced, created_at FROM photos WHERE roll_id = ?1 ORDER BY filename"
    )
    .bind(roll_id)
    .fetch_all(pool)
    .await?;

    Ok(photos)
}

/// Get cover photo for a roll
pub async fn get_roll_cover(pool: &SqlitePool, roll_id: i64) -> Result<Option<Photo>> {
    let photo = sqlx::query_as::<_, Photo>(
        "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, lat, lon, exif_synced, created_at FROM photos WHERE roll_id = ?1 AND is_cover = 1 LIMIT 1"
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
