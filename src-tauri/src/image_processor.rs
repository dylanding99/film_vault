use std::path::{Path, PathBuf};
use anyhow::{Result, Context};
use image::{ImageReader, DynamicImage, imageops::FilterType};
use std::fs;

const THUMBNAIL_WIDTH: u32 = 300;
const THUMBNAIL_QUALITY: u8 = 85;
const PREVIEW_WIDTH: u32 = 1920;
const PREVIEW_QUALITY: u8 = 90;

#[derive(Debug, Clone)]
pub struct ProcessedPaths {
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

    // Generate thumbnail
    let thumbnail_path = thumbnail_dir.join(format!("{}.webp", file_stem));
    generate_thumbnail(original_path, &thumbnail_path)?;

    // Generate preview
    let preview_path = preview_dir.join(format!("{}.webp", file_stem));
    generate_preview(original_path, &preview_path)?;

    Ok(ProcessedPaths {
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
    let webp_encoder = image::codecs::webp::WebPEncoder::new_with_quality(
        image::codecs::webp::WebPQuality::from_quality(THUMBNAIL_QUALITY),
    );
    thumbnail.write_with_encoder(dest, webp_encoder)
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
        let webp_encoder = image::codecs::webp::WebPEncoder::new_with_quality(
            image::codecs::webp::WebPQuality::from_quality(PREVIEW_QUALITY),
        );
        preview.write_with_encoder(dest, webp_encoder)
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
                if image_extensions.contains(&ext.to_lowercase().as_str()) {
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
