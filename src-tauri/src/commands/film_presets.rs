use tauri::State;
use crate::AppState;
use crate::database::{FilmPreset, NewFilmPreset, get_all_film_presets, create_film_preset, update_film_preset, delete_film_preset};
use std::path::{Path, PathBuf};
use std::fs;
use std::io::BufWriter;
use image::{ImageReader, imageops::FilterType};

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

/// Get all film presets
#[tauri::command]
pub async fn get_film_presets_command(state: State<'_, AppState>) -> Result<Vec<FilmPreset>, String> {
    let pool = get_pool(&state).await?;
    get_all_film_presets(&pool).await.map_err(|e| e.to_string())
}

/// Create a new film preset
#[tauri::command]
pub async fn create_film_preset_command(
    preset: NewFilmPreset,
    state: State<'_, AppState>
) -> Result<FilmPreset, String> {
    let pool = get_pool(&state).await?;

    let id = create_film_preset(&pool, preset.clone()).await.map_err(|e: anyhow::Error| e.to_string())?;

    // Return the created preset with ID
    Ok(FilmPreset {
        id,
        name: preset.name,
        format: preset.format,
        brand_color: preset.brand_color,
        image_path: preset.image_path,
        brand: preset.brand,
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

/// Update a film preset
#[tauri::command]
pub async fn update_film_preset_command(
    id: i64,
    preset: NewFilmPreset,
    state: State<'_, AppState>
) -> Result<bool, String> {
    let pool = get_pool(&state).await?;
    update_film_preset(&pool, id, preset).await.map_err(|e: anyhow::Error| e.to_string())
}

/// Delete a film preset
#[tauri::command]
pub async fn delete_film_preset_command(
    id: i64,
    state: State<'_, AppState>
) -> Result<bool, String> {
    let pool = get_pool(&state).await?;

    // First, get the preset to check if it has an image
    let presets = get_all_film_presets(&pool).await.map_err(|e: anyhow::Error| e.to_string())?;
    if let Some(preset) = presets.iter().find(|p| p.id == id) {
        // Delete the image file if it exists
        if let Some(ref image_path) = preset.image_path {
            if let Err(e) = fs::remove_file(image_path) {
                eprintln!("Warning: Failed to delete preset image {}: {}", image_path, e);
            }
        }
    }

    delete_film_preset(&pool, id).await.map_err(|e: anyhow::Error| e.to_string())
}

/// Upload and process a preset image
#[tauri::command]
pub async fn upload_preset_image_command(
    source_path: String,
    _state: State<'_, AppState>
) -> Result<String, String> {
    // Get app data directory
    let app_data_dir = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let presets_dir = PathBuf::from(app_data_dir).join("com.filmvault.app").join("presets");

    // Create presets directory
    fs::create_dir_all(&presets_dir)
        .map_err(|e| format!("Failed to create presets directory: {}", e))?;

    let source = Path::new(&source_path);
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }

    // Verify it's an image
    let supported_extensions = ["jpg", "jpeg", "png", "webp", "bmp"];
    let ext = source.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .ok_or_else(|| "Invalid file extension".to_string())?;

    if !supported_extensions.contains(&ext.as_str()) {
        return Err(format!("Unsupported image format: {}", ext));
    }

    // Calculate a simple hash for unique filename
    let filename = source.file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid filename".to_string())?;

    let hash = format!("{:x}", md5::compute(filename.as_bytes()));
    let new_filename = format!("preset_{}.webp", &hash[..8]);

    let dest_path = presets_dir.join(&new_filename);

    // Process the image: resize to square and convert to WebP
    process_preset_image(source, &dest_path)
        .map_err(|e| format!("Failed to process preset image: {}", e))?;

    Ok(dest_path.to_string_lossy().to_string())
}

/// Process a preset image: crop to square and save as WebP
fn process_preset_image(source: &Path, dest: &Path) -> Result<(), String> {
    let img = ImageReader::open(source)
        .map_err(|e| format!("Failed to open image: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    let width = img.width();
    let height = img.height();
    let size = width.min(height);

    // Crop to square (center crop)
    let x = (width - size) / 2;
    let y = (height - size) / 2;
    let cropped = img.crop_imm(x, y, size, size);

    // Resize to standard size (512x512 for presets)
    let standard_size = 512u32;
    let resized = if size != standard_size {
        cropped.resize(standard_size, standard_size, FilterType::Lanczos3)
    } else {
        cropped
    };

    // Save as WebP
    let dest_file = fs::File::create(dest)
        .map_err(|e| format!("Failed to create destination file: {}", e))?;
    let buffered_writer = BufWriter::new(dest_file);
    let encoder = image::codecs::webp::WebPEncoder::new_lossless(buffered_writer);
    resized.write_with_encoder(encoder)
        .map_err(|e| format!("Failed to save WebP image: {}", e))?;

    Ok(())
}
