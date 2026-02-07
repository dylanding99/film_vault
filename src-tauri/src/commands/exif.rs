/**
 * FilmVault EXIF Commands
 *
 * Tauri commands for EXIF operations using ExifTool
 * Provides complete bidirectional EXIF synchronization
 */

use tauri::State;
use serde::Deserialize;
use futures::stream::{self, StreamExt};

use crate::database::{get_roll_by_id, get_photos_by_roll, get_photo_by_id, mark_photo_exif_synced, update_photo_metadata};
use crate::exif_tool::{
    ExifData, ExifWriteResult, extract_exif, write_photo_roll_exif,
    write_photo_exif, clear_photo_exif, check_exiftool_available, parse_camera_string
};
use crate::AppState;

/// Helper function to get pool from state
async fn get_pool(state: &State<'_, AppState>) -> Result<sqlx::Pool<sqlx::Sqlite>, String> {
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

        drop(db_guard);
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
}

/// Check if ExifTool is available
#[tauri::command]
pub async fn check_exiftool_available_command() -> Result<bool, String> {
    Ok(check_exiftool_available())
}

/// Request structure for writing roll EXIF
#[derive(Debug, Deserialize)]
pub struct WriteRollExifRequest {
    pub roll_id: i64,
    pub auto_write: bool,
}

/// Write roll-level EXIF to all photos in a roll
#[tauri::command]
pub async fn write_roll_exif_command(
    request: WriteRollExifRequest,
    state: State<'_, AppState>,
) -> Result<ExifWriteResult, String> {
    eprintln!("[EXIF] Writing roll EXIF for roll_id: {}", request.roll_id);

    let pool = get_pool(&state).await?;

    // Get roll from database
    let roll = get_roll_by_id(&pool, request.roll_id).await
        .map_err(|e| format!("Failed to query roll: {}", e))?
        .ok_or_else(|| "Roll not found".to_string())?;

    // Get all photos in the roll
    let photos = get_photos_by_roll(&pool, request.roll_id).await
        .map_err(|e| format!("Failed to query photos: {}", e))?;

    if photos.is_empty() {
        return Ok(ExifWriteResult {
            success_count: 0,
            failed_count: 0,
            failed_files: vec![],
        });
    }

    // Parse camera string into make and model
    let (make, model) = parse_camera_string(&roll.camera);

    // Format user comment with film stock
    let user_comment = if !roll.film_stock.is_empty() {
        format!("Shot on {}", roll.film_stock)
    } else {
        String::new()
    };

    // Format date time original from shoot_date
    let date_time_original = format_shoot_date_for_exif(&roll.shoot_date);

    // Write EXIF to all photos with concurrency control
    let results = stream::iter(photos)
        .map(|photo| {
            let file_path = photo.file_path.clone();
            let make_clone = make.clone();
            let model_clone = model.clone();
            let lens_clone = roll.lens.clone();
            let date_clone = date_time_original.clone();
            let comment_clone = user_comment.clone();

            async move {
                (
                    file_path.clone(),
                    write_photo_roll_exif(
                        &file_path,
                        &make_clone,
                        &model_clone,
                        lens_clone.as_deref(),
                        &date_clone,
                        &comment_clone,
                    ).await
                )
            }
        })
        .buffer_unordered(4) // Limit concurrency to 4
        .collect::<Vec<_>>()
        .await;

    // Count successes and failures
    let mut success_count = 0;
    let mut failed_count = 0;
    let mut failed_files = vec![];

    for (file_path, result) in results {
        match result {
            Ok(_) => success_count += 1,
            Err(e) => {
                failed_count += 1;
                failed_files.push(format!("{}: {}", file_path, e));
            }
        }
    }

    eprintln!("[EXIF] Roll EXIF write complete: {} success, {} failed",
        success_count, failed_count);

    Ok(ExifWriteResult {
        success_count,
        failed_count,
        failed_files,
    })
}

/// Request structure for writing photo EXIF
#[derive(Debug, Deserialize)]
pub struct WritePhotoExifRequest {
    pub photo_id: i64,
    pub exif_data: ExifData,
}

/// Write photo-level EXIF to a single photo
#[tauri::command]
pub async fn write_photo_exif_command(
    request: WritePhotoExifRequest,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    eprintln!("[EXIF] Writing photo EXIF for photo_id: {}", request.photo_id);

    let pool = get_pool(&state).await?;

    // Get photo from database
    let photo = get_photo_by_id(&pool, request.photo_id).await
        .map_err(|e| format!("Failed to query: {}", e))?
        .ok_or_else(|| "Photo not found".to_string())?;

    // Write EXIF to the photo file
    write_photo_exif(&photo.file_path, &request.exif_data).await
        .map_err(|e| format!("Failed to write EXIF: {}", e))?;

    // Update user-editable metadata in database (description, comment)
    update_photo_metadata(
        &pool,
        request.photo_id,
        request.exif_data.user_comment,
        request.exif_data.description,
    ).await
    .map_err(|e| format!("Failed to update metadata: {}", e))?;

    // Mark as synced
    mark_photo_exif_synced(&pool, request.photo_id).await
        .map_err(|e| format!("Failed to mark as synced: {}", e))?;

    eprintln!("[EXIF] Photo EXIF write successful");
    Ok(true)
}

/// Clear EXIF from a single photo
#[tauri::command]
pub async fn clear_photo_exif_command(
    photo_id: i64,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    eprintln!("[EXIF] Clearing EXIF for photo_id: {}", photo_id);

    let pool = get_pool(&state).await?;

    // Get photo from database
    let photo = get_photo_by_id(&pool, photo_id).await
        .map_err(|e| format!("Failed to query: {}", e))?
        .ok_or_else(|| "Photo not found".to_string())?;

    // Clear EXIF from the photo file
    clear_photo_exif(&photo.file_path).await
        .map_err(|e| format!("Failed to clear EXIF: {}", e))?;

    eprintln!("[EXIF] Photo EXIF cleared successfully");
    Ok(true)
}

/// Clear EXIF from all photos in a roll
#[tauri::command]
pub async fn clear_roll_exif_command(
    roll_id: i64,
    state: State<'_, AppState>,
) -> Result<ExifWriteResult, String> {
    eprintln!("[EXIF] Clearing roll EXIF for roll_id: {}", roll_id);

    let pool = get_pool(&state).await?;

    // Get all photos in the roll
    let photos = get_photos_by_roll(&pool, roll_id).await
        .map_err(|e| format!("Failed to query photos: {}", e))?;

    if photos.is_empty() {
        return Ok(ExifWriteResult {
            success_count: 0,
            failed_count: 0,
            failed_files: vec![],
        });
    }

    // Clear EXIF from all photos with concurrency control
    let results = stream::iter(photos)
        .map(|photo| {
            let file_path = photo.file_path.clone();
            async move {
                (
                    file_path.clone(),
                    clear_photo_exif(&file_path).await
                )
            }
        })
        .buffer_unordered(4) // Limit concurrency to 4
        .collect::<Vec<_>>()
        .await;

    // Count successes and failures
    let mut success_count = 0;
    let mut failed_count = 0;
    let mut failed_files = vec![];

    for (file_path, result) in results {
        match result {
            Ok(_) => success_count += 1,
            Err(e) => {
                failed_count += 1;
                failed_files.push(format!("{}: {}", file_path, e));
            }
        }
    }

    eprintln!("[EXIF] Roll EXIF clear complete: {} success, {} failed",
        success_count, failed_count);

    Ok(ExifWriteResult {
        success_count,
        failed_count,
        failed_files,
    })
}

/// Read EXIF from a single photo file
#[tauri::command]
pub async fn read_photo_exif_command(
    photo_id: i64,
    state: State<'_, AppState>,
) -> Result<ExifData, String> {
    eprintln!("[EXIF] Reading EXIF for photo_id: {}", photo_id);

    let pool = get_pool(&state).await?;

    // Get photo from database
    let photo = get_photo_by_id(&pool, photo_id).await
        .map_err(|e| format!("Failed to query: {}", e))?
        .ok_or_else(|| "Photo not found".to_string())?;

    // Extract EXIF from the photo file using ExifTool
    let exif = extract_exif(&photo.file_path)
        .map_err(|e| format!("Failed to extract EXIF: {}", e))?;

    eprintln!("[EXIF] Photo EXIF read successfully");
    Ok(exif)
}

/// Format shoot date for EXIF (YYYY:MM:DD HH:MM:SS)
fn format_shoot_date_for_exif(shoot_date: &str) -> String {
    // shoot_date is in format "YYYY-MM-DD", convert to "YYYY:MM:DD 12:00:00"
    // Replace dashes with colons and add default time
    shoot_date.replace("-", ":") + " 12:00:00"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_shoot_date_for_exif() {
        assert_eq!(
            format_shoot_date_for_exif("2024-01-15"),
            "2024:01:15 12:00:00"
        );
        assert_eq!(
            format_shoot_date_for_exif("2023-12-31"),
            "2023:12:31 12:00:00"
        );
    }
}
