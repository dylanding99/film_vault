use std::path::{Path, PathBuf};
use std::fs::{self, File};
use anyhow::{Result, Context};
use image::{ImageReader, imageops::FilterType};
use std::io::BufWriter;

const THUMBNAIL_WIDTH: u32 = 300;
const THUMBNAIL_QUALITY: u8 = 85;
const PREVIEW_WIDTH: u32 = 1920;
const PREVIEW_QUALITY: u8 = 90;

#[derive(Debug, Clone)]
pub struct ProcessedPaths {
    pub filename: String,
    pub original_path: PathBuf,
    pub thumbnail_path: PathBuf,
    pub preview_path: PathBuf,
}

/// Process a single image: generate thumbnail and preview
pub fn process_image(
    original_path: &Path,
    roll_dir: &Path,
) -> Result<ProcessedPaths> {
    // Create subdirectories
    let thumbnail_dir = roll_dir.join("thumbnails");
    let preview_dir = roll_dir.join("previews");

    fs::create_dir_all(&thumbnail_dir)
        .context("Failed to create thumbnail directory")?;
    fs::create_dir_all(&preview_dir)
        .context("Failed to create preview directory")?;

    // Get filename without extension
    let file_stem = original_path
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or_else(|| anyhow::anyhow!("Invalid filename"))?;

    let filename = format!("{}.{}",
        file_stem,
        original_path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg")
    );

    // Generate thumbnail
    let thumbnail_path = thumbnail_dir.join(format!("{}.webp", file_stem));
    generate_thumbnail(original_path, &thumbnail_path)?;

    // Generate preview
    let preview_path = preview_dir.join(format!("{}.webp", file_stem));
    generate_preview(original_path, &preview_path)?;

    Ok(ProcessedPaths {
        filename,
        original_path: original_path.to_path_buf(),
        thumbnail_path,
        preview_path,
    })
}

/// Generate a thumbnail image
fn generate_thumbnail(source: &Path, dest: &Path) -> Result<()> {
    let img = ImageReader::open(source)?
        .decode()
        .context("Failed to decode image")?;

    // Calculate new dimensions maintaining aspect ratio
    let original_width = img.width();
    let original_height = img.height();
    let new_width = THUMBNAIL_WIDTH;
    let new_height = (original_height as f64 * new_width as f64 / original_width as f64) as u32;

    // Resize
    let thumbnail = img.resize(new_width, new_height, FilterType::Lanczos3);

    // Save as WebP
    let dest_file = File::create(dest)
        .context("Failed to create thumbnail file")?;
    let buffered_writer = BufWriter::new(dest_file);
    let encoder = image::codecs::webp::WebPEncoder::new_lossless(buffered_writer);
    thumbnail.write_with_encoder(encoder)
        .context("Failed to save thumbnail")?;

    Ok(())
}

/// Generate a preview image
fn generate_preview(source: &Path, dest: &Path) -> Result<()> {
    let img = ImageReader::open(source)?
        .decode()
        .context("Failed to decode image")?;

    // Only resize if the image is larger than preview width
    if img.width() > PREVIEW_WIDTH {
        let original_width = img.width();
        let original_height = img.height();
        let new_width = PREVIEW_WIDTH;
        let new_height = (original_height as f64 * new_width as f64 / original_width as f64) as u32;

        let preview = img.resize(new_width, new_height, FilterType::Lanczos3);

        let dest_file = File::create(dest)
            .context("Failed to create preview file")?;
        let buffered_writer = BufWriter::new(dest_file);
        let encoder = image::codecs::webp::WebPEncoder::new_lossless(buffered_writer);
        preview.write_with_encoder(encoder)
            .context("Failed to save preview")?;
    } else {
        // If image is smaller, just copy it
        fs::copy(source, dest)
            .context("Failed to copy image for preview")?;
    }

    Ok(())
}

/// Process multiple images in a directory
pub fn process_images_in_directory(
    source_dir: &Path,
    roll_dir: &Path,
) -> Result<Vec<ProcessedPaths>> {
    let mut results = Vec::new();

    // Supported image extensions
    let image_extensions = ["jpg", "jpeg", "png", "tif", "tiff", "webp", "bmp"];

    for entry in fs::read_dir(source_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                if image_extensions.contains(&ext_lower.as_str()) {
                    match process_image(&path, roll_dir) {
                        Ok(processed) => results.push(processed),
                        Err(e) => {
                            eprintln!("Warning: Failed to process {:?}: {}", path, e);
                        }
                    }
                }
            }
        }
    }

    Ok(results)
}

/// Process a single image with file renaming and copy/move
pub fn process_image_with_copy(
    source_path: &Path,
    roll_dir: &Path,
    new_filename: &str,
    copy_mode: bool, // true = copy, false = move
) -> Result<ProcessedPaths> {
    // Create subdirectories
    let originals_dir = roll_dir.join("originals");
    let thumbnail_dir = roll_dir.join("thumbnails");
    let preview_dir = roll_dir.join("previews");

    fs::create_dir_all(&originals_dir)
        .context("Failed to create originals directory")?;
    fs::create_dir_all(&thumbnail_dir)
        .context("Failed to create thumbnail directory")?;
    fs::create_dir_all(&preview_dir)
        .context("Failed to create preview directory")?;

    // Get file extension
    let extension = source_path
        .extension()
        .and_then(|e| e.to_str())
        .ok_or_else(|| anyhow::anyhow!("Invalid file extension"))?;

    // Destination path for original image (in originals/ subdirectory)
    let dest_original_path = originals_dir.join(new_filename);

    // Copy or move the original image
    if copy_mode {
        fs::copy(source_path, &dest_original_path)
            .context("Failed to copy original image")?;
    } else {
        fs::rename(source_path, &dest_original_path)
            .or_else(|_| {
                // If rename fails (cross-device), try copy + delete
                fs::copy(source_path, &dest_original_path)?;
                fs::remove_file(source_path)
            })
            .context("Failed to move original image")?;
    }

    // Get filename without extension for thumbnail/preview
    let file_stem = new_filename.trim_end_matches(&format!(".{}", extension));

    // Generate thumbnail
    let thumbnail_path = thumbnail_dir.join(format!("{}.webp", file_stem));
    generate_thumbnail(&dest_original_path, &thumbnail_path)?;

    // Generate preview
    let preview_path = preview_dir.join(format!("{}.webp", file_stem));
    generate_preview(&dest_original_path, &preview_path)?;

    Ok(ProcessedPaths {
        filename: new_filename.to_string(),
        original_path: dest_original_path,
        thumbnail_path,
        preview_path,
    })
}

/// Process multiple images in a directory with progress callback and file renaming
pub fn process_images_in_directory_with_progress<F>(
    source_dir: &Path,
    roll_dir: &Path,
    roll_id: i64,
    copy_mode: bool,
    mut progress_callback: F,
) -> Result<Vec<ProcessedPaths>>
where
    F: FnMut(usize, usize, String),
{
    let mut results = Vec::new();

    // Supported image extensions
    let image_extensions = ["jpg", "jpeg", "png", "tif", "tiff", "webp", "bmp"];

    // First, collect all image files
    let mut image_files: Vec<PathBuf> = Vec::new();
    for entry in fs::read_dir(source_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                if image_extensions.contains(&ext_lower.as_str()) {
                    image_files.push(path);
                }
            }
        }
    }

    let total = image_files.len();
    eprintln!("[Import] Found {} images to process", total);

    // Generate roll code for filename prefix
    let roll_code = format!("ROLL_{:08X}", roll_id);

    // Process each image with a new sequential filename
    for (index, source_path) in image_files.iter().enumerate() {
        let current = index + 1;

        // Get original filename for display
        let original_filename = source_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Get file extension
        let extension = source_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg");

        // Generate new filename (ROLL_A3F80001_001.jpg, ROLL_A3F80001_002.jpg, etc.)
        let new_filename = format!("{}_{:03}.{}", roll_code, current, extension);

        eprintln!("[Import] Processing {}/{}: {} -> {}", current, total, original_filename, new_filename);

        // Send progress update
        progress_callback(current, total, original_filename.clone());

        // Process the image
        match process_image_with_copy(source_path, roll_dir, &new_filename, copy_mode) {
            Ok(processed) => results.push(processed),
            Err(e) => {
                eprintln!("Warning: Failed to process {:?}: {}", source_path, e);
            }
        }
    }

    Ok(results)
}

/// Get file size in MB
pub fn get_file_size_mb(path: &Path) -> Result<f64> {
    let metadata = fs::metadata(path)?;
    let bytes = metadata.len();
    Ok(bytes as f64 / (1024.0 * 1024.0))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_dimensions() {
        // Test aspect ratio calculation
        let original_width = 6000;
        let original_height = 4000;
        let new_width = 300;
        let new_height = (original_height as f64 * new_width as f64 / original_width as f64) as u32;

        assert_eq!(new_width, 300);
        assert_eq!(new_height, 200);
    }
}
