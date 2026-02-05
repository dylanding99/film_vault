use std::path::{Path, PathBuf};
use tauri::State;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use walkdir::WalkDir;
use chrono::{DateTime, Utc};

use crate::database::{NewRoll, NewPhoto, create_roll, create_photos};
use crate::image_processor::process_images_in_directory;
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
}

/// Import a folder of images as a new roll
#[tauri::command]
pub async fn import_folder(
    options: ImportOptions,
    state: State<'_, AppState>,
) -> Result<ImportResult, String> {
    // Get the pool from state
    let db_guard = state.db_pool.lock().await;
    let pool = db_guard.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    // Validate source path exists
    let source_path = Path::new(&options.source_path);
    if !source_path.exists() {
        return Err("Source path does not exist".to_string());
    }

    // Parse shoot date to extract year and format date
    let shoot_date = parse_shoot_date(&options.shoot_date)
        .map_err(|e| format!("Invalid shoot date: {}", e))?;

    // Generate roll directory name: [YYYY]/[YYYY-MM-DD]_[FilmStock]_[Camera]/
    let year = &shoot_date[0..4];
    let date_part = &shoot_date[0..10];

    // Sanitize film stock and camera names for directory
    let safe_film_stock = sanitize_filename(&options.film_stock);
    let safe_camera = sanitize_filename(&options.camera);

    let dir_name = format!("{}_{}_{}", date_part, safe_film_stock, safe_camera);

    // Create full destination path
    let roll_dir = Path::new(&options.library_root)
        .join(year)
        .join(&dir_name);

    // Create roll directory
    std::fs::create_dir_all(&roll_dir)
        .map_err(|e| format!("Failed to create roll directory: {}", e))?;

    // Process images (copy and generate thumbnails/preview)
    let processed_images = process_images_in_directory(source_path, &roll_dir)
        .map_err(|e| format!("Failed to process images: {}", e))?;

    if processed_images.is_empty() {
        return Err("No images found in source directory".to_string());
    }

    // Create roll in database
    let roll_name = options.roll_name.unwrap_or_else(|| dir_name.clone());
    let new_roll = NewRoll {
        name: roll_name,
        path: roll_dir.to_string_lossy().to_string(),
        film_stock: options.film_stock.clone(),
        camera: options.camera.clone(),
        lens: options.lens,
        shoot_date,
        lab_info: None,
        notes: options.notes,
    };

    let roll_id = create_roll(pool, new_roll).await
        .map_err(|e| format!("Failed to create roll in database: {}", e))?;

    // Create photo records in database
    let new_photos: Vec<NewPhoto> = processed_images
        .iter()
        .map(|p| NewPhoto {
            roll_id,
            filename: p.original_path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string(),
            file_path: p.original_path.to_string_lossy().to_string(),
            thumbnail_path: Some(p.thumbnail_path.to_string_lossy().to_string()),
            preview_path: Some(p.preview_path.to_string_lossy().to_string()),
        })
        .collect();

    create_photos(pool, new_photos).await
        .map_err(|e| format!("Failed to create photos in database: {}", e))?;

    Ok(ImportResult {
        roll_id,
        photos_count: processed_images.len(),
        message: format!(
            "Successfully imported {} photos as roll '{}'",
            processed_images.len(),
            dir_name
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
}
