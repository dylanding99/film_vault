use tauri::State;
use serde::{Deserialize, Serialize};

use crate::database::{
    Roll, Photo, NewRoll,
    get_all_rolls, get_roll_by_id, update_roll, delete_roll,
    get_photos_by_roll, get_roll_cover, set_photo_as_cover,
    update_photo_rating, update_photo_location,
};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateRollRequest {
    pub id: i64,
    pub name: String,
    pub film_stock: String,
    pub camera: String,
    pub lens: Option<String>,
    pub shoot_date: String,
    pub lab_info: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RollWithPhotos {
    pub roll: Roll,
    pub photos: Vec<Photo>,
    pub cover_photo: Option<Photo>,
}

/// Helper function to get pool from state
/// Will wait up to 10 seconds for database to be initialized
async fn get_pool(state: &State<'_, AppState>) -> Result<sqlx::Pool<sqlx::Sqlite>, String> {
    // Wait for database to be initialized (up to 10 seconds)
    let mut attempts = 0;
    let max_attempts = 100; // 10 seconds (100 * 100ms)

    loop {
        let db_guard = state.db_pool.lock().await;
        if let Some(pool) = db_guard.as_ref() {
            return Ok(pool.clone());
        }

        attempts += 1;
        if attempts >= max_attempts {
            drop(db_guard);
            return Err("Database not initialized. Please wait a moment and try again.".to_string());
        }

        // Release lock before waiting
        drop(db_guard);
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
}

/// Get all rolls
#[tauri::command]
pub async fn get_all_rolls_command(
    state: State<'_, AppState>,
) -> Result<Vec<Roll>, String> {
    let pool = get_pool(&state).await?;
    get_all_rolls(&pool)
        .await
        .map_err(|e| format!("Failed to get rolls: {}", e))
}

/// Get roll by ID
#[tauri::command]
pub async fn get_roll_by_id_command(
    id: i64,
    state: State<'_, AppState>,
) -> Result<Option<Roll>, String> {
    let pool = get_pool(&state).await?;
    get_roll_by_id(&pool, id)
        .await
        .map_err(|e| format!("Failed to get roll: {}", e))
}

/// Get roll with photos
#[tauri::command]
pub async fn get_roll_with_photos(
    id: i64,
    state: State<'_, AppState>,
) -> Result<RollWithPhotos, String> {
    let pool = get_pool(&state).await?;

    let roll = get_roll_by_id(&pool, id)
        .await
        .map_err(|e| format!("Failed to get roll: {}", e))?
        .ok_or_else(|| "Roll not found".to_string())?;

    let photos = get_photos_by_roll(&pool, id)
        .await
        .map_err(|e| format!("Failed to get photos: {}", e))?;

    let cover_photo = get_roll_cover(&pool, id)
        .await
        .map_err(|e| format!("Failed to get cover photo: {}", e))?;

    Ok(RollWithPhotos {
        roll,
        photos,
        cover_photo,
    })
}

/// Update roll metadata
#[tauri::command]
pub async fn update_roll_command(
    request: UpdateRollRequest,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let pool = get_pool(&state).await?;

    let new_roll = NewRoll {
        name: request.name,
        path: String::new(), // Path won't be updated through this command
        film_stock: request.film_stock,
        camera: request.camera,
        lens: request.lens,
        shoot_date: request.shoot_date,
        lab_info: request.lab_info,
        notes: request.notes,
    };

    update_roll(&pool, request.id, new_roll)
        .await
        .map_err(|e| format!("Failed to update roll: {}", e))
}

/// Delete roll
#[tauri::command]
pub async fn delete_roll_command(
    id: i64,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let pool = get_pool(&state).await?;
    delete_roll(&pool, id)
        .await
        .map_err(|e| format!("Failed to delete roll: {}", e))
}

/// Set photo as roll cover
#[tauri::command]
pub async fn set_photo_as_cover_command(
    roll_id: i64,
    photo_id: i64,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let pool = get_pool(&state).await?;
    set_photo_as_cover(&pool, roll_id, photo_id)
        .await
        .map_err(|e| format!("Failed to set cover photo: {}", e))
}

/// Update photo rating
#[tauri::command]
pub async fn update_photo_rating_command(
    photo_id: i64,
    rating: i32,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    if rating < 0 || rating > 5 {
        return Err("Rating must be between 0 and 5".to_string());
    }

    let pool = get_pool(&state).await?;
    update_photo_rating(&pool, photo_id, rating)
        .await
        .map_err(|e| format!("Failed to update rating: {}", e))
}

/// Update photo location
#[tauri::command]
pub async fn update_photo_location_command(
    photo_id: i64,
    lat: f64,
    lon: f64,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let pool = get_pool(&state).await?;
    update_photo_location(&pool, photo_id, lat, lon)
        .await
        .map_err(|e| format!("Failed to update location: {}", e))
}

/// Get photos by roll ID
#[tauri::command]
pub async fn get_photos_by_roll_command(
    roll_id: i64,
    state: State<'_, AppState>,
) -> Result<Vec<Photo>, String> {
    let pool = get_pool(&state).await?;
    get_photos_by_roll(&pool, roll_id)
        .await
        .map_err(|e| format!("Failed to get photos: {}", e))
}

/// Read image file and convert to base64 data URL
#[tauri::command]
pub async fn read_image_as_base64(path: String) -> Result<String, String> {
    use std::fs;
    use std::io::Read;

    // Read the file
    let mut file = fs::File::open(&path)
        .map_err(|e| format!("Failed to open file: {}", e))?;

    // Get file metadata to determine size
    let metadata = file.metadata()
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;

    let mut buffer = Vec::with_capacity(metadata.len() as usize);
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Encode to base64
    let base64_string = base64::encode(&buffer);

    // Determine MIME type based on file extension
    let mime_type = if path.ends_with(".webp") {
        "image/webp"
    } else if path.ends_with(".jpg") || path.ends_with(".jpeg") {
        "image/jpeg"
    } else if path.ends_with(".png") {
        "image/png"
    } else {
        "image/jpeg" // Default to JPEG
    };

    Ok(format!("data:{};base64,{}", mime_type, base64_string))
}
