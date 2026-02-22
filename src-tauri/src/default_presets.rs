use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::path::{Path, PathBuf};
use anyhow::{Result, Context};
use image::{ImageReader, imageops::FilterType};
use std::io::BufWriter;
use std::fs;

/// Default preset configuration
#[derive(Debug, Serialize, Deserialize)]
pub struct DefaultPresetsConfig {
    pub presets: Vec<PresetConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PresetConfig {
    pub name: String,
    pub brand: String,
    pub format: String,
    pub image: String,
    pub brand_color: String,
}

/// Get the default presets embedded in the binary
fn get_default_presets_json() -> &'static str {
    // This will be included at compile time
    include_str!("../presets/default_presets.json")
}

/// Check if presets need to be initialized
pub async fn needs_preset_initialization(pool: &SqlitePool) -> Result<bool, String> {
    // Check if presets table is empty
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM film_presets")
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Failed to check preset count: {}", e))?;

    Ok(count == 0)
}

/// Process a preset image: crop to square and save as WebP
fn process_preset_image(source: &Path, dest: &Path) -> Result<()> {
    let img = ImageReader::open(source)
        .context("Failed to open preset image")?
        .decode()
        .context("Failed to decode preset image")?;

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
        .context("Failed to create destination file")?;
    let buffered_writer = BufWriter::new(dest_file);
    let encoder = image::codecs::webp::WebPEncoder::new_lossless(buffered_writer);
    resized.write_with_encoder(encoder)
        .context("Failed to save WebP image")?;

    Ok(())
}

/// Initialize default film presets from embedded JSON config
pub async fn initialize_default_presets(pool: &SqlitePool) -> Result<(), String> {
    eprintln!("[Presets] Checking if default presets need initialization...");

    // Check if initialization is needed
    if !needs_preset_initialization(pool).await? {
        eprintln!("[Presets] Presets already exist, skipping initialization");
        return Ok(());
    }

    eprintln!("[Presets] Initializing default presets...");

    // Parse the embedded JSON config
    let config_json = get_default_presets_json();
    let config: DefaultPresetsConfig = serde_json::from_str(config_json)
        .map_err(|e| format!("Failed to parse default_presets.json: {}", e))?;

    eprintln!("[Presets] Found {} default presets to import", config.presets.len());

    // Get app data directory for storing processed images
    let app_data_dir = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let presets_dir = PathBuf::from(&app_data_dir)
        .join("com.filmvault.app")
        .join("presets");

    fs::create_dir_all(&presets_dir)
        .map_err(|e| format!("Failed to create presets directory: {}", e))?;

    // Get the resource directory path (where the preset images are bundled)
    let resource_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get exe path: {}", e))?
        .parent()
        .ok_or("Failed to get exe parent directory")?
        .to_path_buf();

    let bundled_presets_dir = resource_dir.join("presets");

    eprintln!("[Presets] Bundled presets directory: {:?}", bundled_presets_dir);
    eprintln!("[Presets] Target presets directory: {:?}", presets_dir);

    // Process each preset
    let mut imported_count = 0;
    for preset_config in &config.presets {
        let source_path = bundled_presets_dir.join(&preset_config.image);
        eprintln!("[Presets] Processing: {} ({})", preset_config.name, preset_config.format);

        // Check if source image exists
        if !source_path.exists() {
            eprintln!("[Presets] Warning: Preset image not found: {:?}, skipping", source_path);
            continue;
        }

        // Generate a unique filename for the processed image
        let hash = format!("{:x}", md5::compute(preset_config.name.as_bytes()));
        let new_filename = format!("preset_{}.webp", &hash[..8]);
        let dest_path = presets_dir.join(&new_filename);

        // Process the image
        if let Err(e) = process_preset_image(&source_path, &dest_path) {
            eprintln!("[Presets] Warning: Failed to process image for {}: {}", preset_config.name, e);
            continue;
        }

        // Insert into database
        let result = sqlx::query(
            r#"
            INSERT INTO film_presets (name, format, brand_color, image_path, brand)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#
        )
        .bind(&preset_config.name)
        .bind(&preset_config.format)
        .bind(&preset_config.brand_color)
        .bind(dest_path.to_string_lossy().to_string())
        .bind(&preset_config.brand)
        .execute(pool)
        .await;

        match result {
            Ok(_) => {
                eprintln!("[Presets] Imported: {}", preset_config.name);
                imported_count += 1;
            }
            Err(e) => {
                eprintln!("[Presets] Error importing {}: {}", preset_config.name, e);
            }
        }
    }

    eprintln!("[Presets] Initialization complete. Imported {} presets", imported_count);
    Ok(())
}
