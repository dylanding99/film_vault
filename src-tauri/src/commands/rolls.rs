use tauri::State;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use crate::database::{
    Roll, Photo, NewRoll,
    get_all_rolls, get_roll_by_id, update_roll, delete_roll,
    get_photos_by_roll, get_roll_cover, set_photo_as_cover,
    update_photo_rating, update_photo_location, delete_photo, delete_photos,
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
pub struct DeleteRollRequest {
    pub id: i64,
    pub delete_files: bool,
    pub delete_originals: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeletePhotosRequest {
    pub photo_ids: Vec<i64>,
    pub delete_files: bool,
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

/// Delete physical files associated with a roll
async fn delete_roll_files(
    roll_path: &str,
    delete_originals: bool,
) -> Result<(), String> {
    let path = Path::new(roll_path);

    if !path.exists() {
        eprintln!("[DeleteRoll] Roll directory does not exist: {}", roll_path);
        return Ok(()); // Directory doesn't exist, consider it a success
    }

    // 1. Delete thumbnails directory
    let thumbnails_dir = path.join("thumbnails");
    if thumbnails_dir.exists() {
        eprintln!("[DeleteRoll] Deleting thumbnails directory: {:?}", thumbnails_dir);
        fs::remove_dir_all(&thumbnails_dir)
            .map_err(|e| format!("Failed to delete thumbnails: {}", e))?;
    }

    // 2. Delete previews directory
    let previews_dir = path.join("previews");
    if previews_dir.exists() {
        eprintln!("[DeleteRoll] Deleting previews directory: {:?}", previews_dir);
        fs::remove_dir_all(&previews_dir)
            .map_err(|e| format!("Failed to delete previews: {}", e))?;
    }

    // 3. Optionally delete original files
    if delete_originals {
        eprintln!("[DeleteRoll] Deleting original files...");
        let image_extensions = ["jpg", "jpeg", "png", "tif", "tiff", "webp", "bmp"];

        let mut files_deleted = 0;
        for entry in fs::read_dir(path)
            .map_err(|e| format!("Failed to read roll directory: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let file_path = entry.path();

            // Skip directories
            if file_path.is_dir() {
                continue;
            }

            // Check file extension
            if let Some(ext) = file_path.extension().and_then(|e| e.to_str()) {
                if image_extensions.contains(&ext.to_lowercase().as_str()) {
                    eprintln!("[DeleteRoll] Deleting file: {:?}", file_path);
                    fs::remove_file(&file_path)
                        .map_err(|e| format!("Failed to delete file {:?}: {}", file_path, e))?;
                    files_deleted += 1;
                }
            }
        }

        eprintln!("[DeleteRoll] Deleted {} original files", files_deleted);

        // Try to remove the directory if it's empty
        if files_deleted > 0 {
            let _ = fs::remove_dir(path); // Ignore error if directory not empty
        }
    } else {
        // Check if directory is empty (only contains deleted subdirectories)
        let remaining_files: Vec<_> = fs::read_dir(path)
            .map_err(|e| format!("Failed to check remaining files: {}", e))?
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_file())
            .collect();

        if remaining_files.is_empty() {
            eprintln!("[DeleteRoll] Removing empty directory: {:?}", path);
            let _ = fs::remove_dir(path);
        } else {
            eprintln!("[DeleteRoll] Keeping directory with {} original files", remaining_files.len());
        }
    }

    Ok(())
}

/// Delete roll
#[tauri::command]
pub async fn delete_roll_command(
    request: DeleteRollRequest,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let pool = get_pool(&state).await?;

    // 1. Get roll path before deleting from database
    let roll = get_roll_by_id(&pool, request.id)
        .await
        .map_err(|e| format!("Failed to get roll: {}", e))?
        .ok_or_else(|| "Roll not found".to_string())?;

    eprintln!("[DeleteRoll] Deleting roll {} ({})", request.id, roll.name);

    // 2. Delete from database (photos will be cascade deleted)
    let deleted = delete_roll(&pool, request.id)
        .await
        .map_err(|e| format!("Failed to delete roll from database: {}", e))?;

    if !deleted {
        return Err("Roll was already deleted".to_string());
    }

    eprintln!("[DeleteRoll] Database records deleted successfully");

    // 3. Delete physical files if requested
    if request.delete_files {
        eprintln!("[DeleteRoll] Deleting physical files (delete_originals: {})", request.delete_originals);
        if let Err(e) = delete_roll_files(&roll.path, request.delete_originals).await {
            eprintln!("[Warning] Failed to delete files for roll {}: {}", request.id, e);
            // Don't return error - database deletion succeeded
        }
    }

    eprintln!("[DeleteRoll] Roll {} deleted successfully", request.id);
    Ok(true)
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

/// Delete physical files for a photo
async fn delete_photo_files(
    photo: &Photo,
) -> Result<(), String> {
    // Delete thumbnail
    if let Some(ref thumbnail_path) = photo.thumbnail_path {
        let thumb_path = Path::new(thumbnail_path);
        if thumb_path.exists() {
            eprintln!("[DeletePhoto] Deleting thumbnail: {:?}", thumb_path);
            fs::remove_file(thumb_path)
                .map_err(|e| format!("Failed to delete thumbnail: {}", e))?;
        }
    }

    // Delete preview
    if let Some(ref preview_path) = photo.preview_path {
        let preview_path_obj = Path::new(preview_path);
        if preview_path_obj.exists() {
            eprintln!("[DeletePhoto] Deleting preview: {:?}", preview_path_obj);
            fs::remove_file(preview_path_obj)
                .map_err(|e| format!("Failed to delete preview: {}", e))?;
        }
    }

    Ok(())
}

/// Delete a single photo
#[tauri::command]
pub async fn delete_photo_command(
    photo_id: i64,
    delete_files: bool,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let pool = get_pool(&state).await?;

    // Get photo info before deleting from database
    let roll_id = {
        let photos = get_photos_by_roll(&pool, 0) // Placeholder, we'll get the photo first
            .await
            .map_err(|e| format!("Failed to get photos: {}", e))?;

        // Get the photo from database - we need to query it properly
        // Let's use a different approach
        let photo = sqlx::query_as::<_, Photo>(
            "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, lat, lon, exif_synced, created_at FROM photos WHERE id = ?1"
        )
        .bind(photo_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Failed to get photo: {}", e))?
        .ok_or_else(|| "Photo not found".to_string())?;

        let roll_id = photo.roll_id;

        // Delete physical files if requested
        if delete_files {
            if let Err(e) = delete_photo_files(&photo).await {
                eprintln!("[Warning] Failed to delete files for photo {}: {}", photo_id, e);
            }
        }

        roll_id
    };

    // Delete from database
    let deleted = delete_photo(&pool, photo_id)
        .await
        .map_err(|e| format!("Failed to delete photo: {}", e))?;

    if deleted {
        eprintln!("[DeletePhoto] Photo {} deleted successfully", photo_id);
    }

    Ok(deleted)
}

/// Batch delete photos
#[tauri::command]
pub async fn delete_photos_command(
    request: DeletePhotosRequest,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    let pool = get_pool(&state).await?;

    eprintln!("[DeletePhotos] Deleting {} photos", request.photo_ids.len());

    // Get photos info before deleting from database
    if request.delete_files {
        for photo_id in &request.photo_ids {
            // Get photo info
            let photo = sqlx::query_as::<_, Photo>(
                "SELECT id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, lat, lon, exif_synced, created_at FROM photos WHERE id = ?1"
            )
            .bind(photo_id)
            .fetch_optional(&pool)
            .await
            .map_err(|e| format!("Failed to get photo: {}", e))?;

            if let Some(photo) = photo {
                // Delete physical files
                if let Err(e) = delete_photo_files(&photo).await {
                    eprintln!("[Warning] Failed to delete files for photo {}: {}", photo_id, e);
                }
            }
        }
    }

    // Delete from database
    let count = delete_photos(&pool, request.photo_ids.clone())
        .await
        .map_err(|e| format!("Failed to delete photos: {}", e))?;

    eprintln!("[DeletePhotos] {} photos deleted successfully", count);
    Ok(count)
}
