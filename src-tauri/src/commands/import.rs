use std::path::Path;
use tauri::{State, Emitter, AppHandle};
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;
use futures::stream::{self, StreamExt};

use crate::database::{NewRoll, NewPhoto, create_roll, create_photos};
use crate::image_processor::process_images_in_directory_with_progress;
use crate::exif_tool::{write_photo_roll_exif, parse_camera_string};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub roll_id: i64,
    pub photos_count: usize,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportOptions {
    pub source_path: String,
    pub film_stock: String,
    pub camera: String,
    pub lens: Option<String>,
    pub shoot_date: String,
    pub library_root: String,
    pub roll_name: Option<String>,
    pub notes: Option<String>,
    pub copy_mode: bool, // true = copy, false = move
    pub auto_write_exif: Option<bool>, // Whether to write EXIF to photos on import
}

/// Import a folder of images as a new roll
#[tauri::command]
pub async fn import_folder(
    options: ImportOptions,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ImportResult, String> {
    eprintln!("[Import] import_folder called, waiting for database...");

    // Wait for database to be initialized (up to 30 seconds)
    let mut attempts = 0;
    let max_attempts = 300; // 30 seconds (300 * 100ms)
    let pool = loop {
        let db_guard = state.db_pool.lock().await;
        if let Some(pool) = db_guard.as_ref() {
            eprintln!("[Import] Database initialized after {} attempts", attempts);
            break pool.clone();
        }

        attempts += 1;
        if attempts % 10 == 0 {
            eprintln!("[Import] Still waiting for database... ({}/{})", attempts, max_attempts);
        }

        if attempts >= max_attempts {
            drop(db_guard);
            eprintln!("[Import] Database initialization timeout after {} attempts", attempts);
            return Err("Database not initialized. Please check the terminal logs for errors.".to_string());
        }

        // Release lock before waiting
        drop(db_guard);
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    };

    // Validate source path exists
    let source_path = Path::new(&options.source_path);
    if !source_path.exists() {
        return Err("Source path does not exist".to_string());
    }

    // Parse shoot date to extract year
    let shoot_date = parse_shoot_date(&options.shoot_date)
        .map_err(|e| format!("Invalid shoot date: {}", e))?;

    let year = &shoot_date[0..4];

    // First, create roll in database to get the ID
    let roll_name = options.roll_name.unwrap_or_else(|| format!("Roll - {}", &options.shoot_date));
    let new_roll = NewRoll {
        name: roll_name.clone(),
        path: String::new(), // Will update after creating directory
        film_stock: options.film_stock.clone(),
        camera: options.camera.clone(),
        lens: options.lens.clone(),
        shoot_date: shoot_date.clone(),
        lab_info: None,
        notes: options.notes.clone(),
    };

    let roll_id = create_roll(&pool, new_roll).await
        .map_err(|e| format!("Failed to create roll in database: {}", e))?;

    // Generate unique directory name from roll ID (8-character hex code)
    let dir_code = format!("{:08X}", roll_id);
    let roll_dir = Path::new(&options.library_root)
        .join(year)
        .join(&dir_code);

    // Create roll directory
    std::fs::create_dir_all(&roll_dir)
        .map_err(|e| format!("Failed to create roll directory: {}", e))?;

    // Update roll path in database
    let roll_path = roll_dir.to_string_lossy().to_string();
    sqlx::query("UPDATE rolls SET path = ?1 WHERE id = ?2")
        .bind(&roll_path)
        .bind(roll_id)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to update roll path: {}", e))?;

    eprintln!("[Import] Created roll directory: {:?}", roll_dir);

    // Process images with progress callback
    let app_handle = app.clone();
    let processed_images = process_images_in_directory_with_progress(
        source_path,
        &roll_dir,
        roll_id,
        options.copy_mode,
        move |current, total, filename| {
            // Send progress event to frontend
            let _ = app_handle.emit("import-progress", serde_json::json!({
                "current": current,
                "total": total,
                "filename": filename,
                "rollId": roll_id,
            }));
        }
    ).map_err(|e| format!("Failed to process images: {}", e))?;

    if processed_images.is_empty() {
        return Err("No images found in source directory".to_string());
    }

    eprintln!("[Import] Processed {} images", processed_images.len());

    // Create photo records in database
    let photos_count = processed_images.len();
    let new_photos: Vec<NewPhoto> = processed_images
        .iter()
        .map(|p| NewPhoto {
            roll_id,
            filename: p.filename.clone(),
            file_path: p.original_path.to_string_lossy().to_string(),
            thumbnail_path: Some(p.thumbnail_path.to_string_lossy().to_string()),
            preview_path: Some(p.preview_path.to_string_lossy().to_string()),
        })
        .collect();

    create_photos(&pool, new_photos).await
        .map_err(|e| format!("Failed to create photos in database: {}", e))?;

    // Write EXIF if enabled
    if options.auto_write_exif.unwrap_or(false) {
        eprintln!("[Import] Auto-writing EXIF to {} photos", photos_count);

        // Parse camera string into make and model
        let (make, model) = parse_camera_string(&options.camera);

        // Format user comment with film stock
        let user_comment = if !options.film_stock.is_empty() {
            format!("Shot on {}", options.film_stock)
        } else {
            String::new()
        };

        // Format date time original from shoot_date (replace - with :)
        let date_time_original = format_exif_date(&shoot_date);

        // Write EXIF to all photos with concurrency control
        let _results = stream::iter(processed_images)
            .map(|p| {
                let file_path = p.original_path.clone();
                let make_clone = make.clone();
                let model_clone = model.clone();
                let lens_clone = options.lens.clone();
                let date_clone = date_time_original.clone();
                let comment_clone = user_comment.clone();

                async move {
                    (
                        file_path.clone(),
                        write_photo_roll_exif(
                            &file_path.to_string_lossy(),
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

        // Note: We don't check results here to avoid blocking import on EXIF write failures
        // Errors are logged to console
    }

    // Send completion event
    let _ = app.emit("import-complete", serde_json::json!({
        "rollId": roll_id,
        "count": photos_count,
        "path": roll_path,
    }));

    Ok(ImportResult {
        roll_id,
        photos_count,
        message: format!(
            "成功导入 {} 张照片到胶卷文件夹",
            photos_count
        ),
    })
}

/// Parse and validate shoot date
fn parse_shoot_date(date_str: &str) -> Result<String, String> {
    // Try to parse as ISO 8601 date
    let parsed = date_str.parse::<chrono::NaiveDate>()
        .map_err(|_| "Invalid date format. Use YYYY-MM-DD".to_string())?;

    Ok(parsed.format("%Y-%m-%d").to_string())
}

/// Format shoot date for EXIF (YYYY:MM:DD HH:MM:SS)
fn format_exif_date(shoot_date: &str) -> String {
    // shoot_date is in format "YYYY-MM-DD", convert to "YYYY:MM:DD 12:00:00"
    // Replace dashes with colons and add default time
    shoot_date.replace("-", ":") + " 12:00:00"
}

/// Sanitize filename by removing/replacing problematic characters
fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            ' ' | '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c
        })
        .collect()
}

/// Get count of images in a directory (without processing)
#[tauri::command]
pub async fn preview_import_count(source_path: String) -> Result<usize, String> {
    let path = Path::new(&source_path);
    if !path.exists() {
        return Err("Source path does not exist".to_string());
    }

    let image_extensions = ["jpg", "jpeg", "png", "tif", "tiff", "webp", "bmp"];
    let mut count = 0;

    for entry in WalkDir::new(path)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let file_path = entry.path();
        if file_path.is_file() {
            if let Some(ext) = file_path.extension().and_then(|e| e.to_str()) {
                if image_extensions.contains(&ext.to_lowercase().as_str()) {
                    count += 1;
                }
            }
        }
    }

    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("Kodak Portra 400"), "Kodak_Portra_400");
        assert_eq!(sanitize_filename("Camera/Model"), "Camera_Model");
        assert_eq!(sanitize_filename("Test:Name"), "Test_Name");
    }

    #[test]
    fn test_parse_shoot_date() {
        assert!(parse_shoot_date("2024-01-15").is_ok());
        assert!(parse_shoot_date("invalid").is_err());
    }

    #[test]
    fn test_format_exif_date() {
        assert_eq!(
            format_exif_date("2024-01-15"),
            "2024:01:15 12:00:00"
        );
        assert_eq!(
            format_exif_date("2023-12-31"),
            "2023:12:31 12:00:00"
        );
    }
}
