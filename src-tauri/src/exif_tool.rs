/**
 * FilmVault EXIF Tool Integration
 *
 * Core module for EXIF bidirectional integration using ExifTool.
 * Handles EXIF reading and writing operations via ExifTool command-line.
 */

use std::process::Command;
use std::path::Path;
use serde::{Deserialize, Serialize};
use anyhow::Result;

/// EXIF data structure for reading and writing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExifData {
    // Roll-level fields (from roll metadata)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub make: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub lens_model: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_time_original: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub film_stock: Option<String>,

    // Photo-level fields (shot-specific)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub iso: Option<i32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub aperture: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub shutter_speed: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub focal_length: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub gps_latitude: Option<f64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub gps_longitude: Option<f64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub gps_altitude: Option<f64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub rating: Option<i32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_comment: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

/// Result of EXIF write operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExifWriteResult {
    pub success_count: usize,
    pub failed_count: usize,
    pub failed_files: Vec<String>,
}

/// Check if ExifTool is available
pub fn check_exiftool_available() -> bool {
    match Command::new("exiftool")
        .arg("-ver")
        .output()
    {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

/// Extract EXIF data from a file using ExifTool
pub fn extract_exif(file_path: &str) -> Result<ExifData> {
    eprintln!("[EXIF] Extracting EXIF from: {}", file_path);

    // Check if file exists
    if !Path::new(file_path).exists() {
        eprintln!("[EXIF] File not found: {}", file_path);
        return Ok(ExifData::default());
    }

    // Call ExifTool with JSON output for structured data
    let output = Command::new("exiftool")
        .arg("-j")                     // JSON output
        .arg("-coordFormat")           // GPS coordinates format
        .arg("%f")                     // Use decimal format for GPS
        .arg(file_path)
        .output()
        .map_err(|e| {
            eprintln!("[EXIF] Failed to execute exiftool: {}", e);
            anyhow::anyhow!("Failed to execute exiftool: {}", e)
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        eprintln!("[EXIF] ExifTool returned error: {}", stderr);
        return Ok(ExifData::default());
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    eprintln!("[EXIF] ExifTool output: {}", json_str);

    if json_str.trim().is_empty() {
        eprintln!("[EXIF] No EXIF data found (empty output)");
        return Ok(ExifData::default());
    }

    // Parse JSON output
    let exif_array: Vec<serde_json::Value> = serde_json::from_str(&json_str)
        .map_err(|e| {
            eprintln!("[EXIF] Failed to parse EXIF JSON: {}", e);
            anyhow::anyhow!("Failed to parse EXIF JSON: {}", e)
        })?;

    if exif_array.is_empty() {
        return Ok(ExifData::default());
    }

    let exif_obj = &exif_array[0];

    // Extract fields from ExifTool output
    // Note: ExifTool uses different field names
    let make = exif_obj["Make"].as_str().map(String::from);
    let model = exif_obj["Model"].as_str().map(String::from);
    let lens_model = exif_obj["LensModel"].as_str()
        .or_else(|| exif_obj["Lens"].as_str())
        .map(String::from);

    let date_time_original = exif_obj["DateTimeOriginal"].as_str()
        .or_else(|| exif_obj["CreateDate"].as_str())
        .map(String::from);

    // Try to extract film stock from UserComment
    let user_comment_raw = exif_obj["UserComment"].as_str().map(String::from);
    let film_stock = user_comment_raw.as_ref().and_then(|s| {
        s.split("Shot on ").nth(1).map(String::from)
    });

    let iso = exif_obj["ISO"].as_i64()
        .or_else(|| exif_obj["ISOSpeedRatings"].as_i64())
        .map(|v| v as i32);

    let aperture = exif_obj["Aperture"].as_str()
        .or_else(|| exif_obj["FNumber"].as_str())
        .map(|s| {
            if s.starts_with('f') {
                s.to_string()
            } else {
                format!("f/{}", s)
            }
        });

    let shutter_speed = exif_obj["ShutterSpeed"].as_str()
        .or_else(|| exif_obj["ExposureTime"].as_str())
        .map(String::from);

    let focal_length = exif_obj["FocalLength"].as_str()
        .map(String::from);

    let gps_latitude = exif_obj["GPSLatitude"].as_f64();
    let gps_longitude = exif_obj["GPSLongitude"].as_f64();
    let gps_altitude = exif_obj["GPSAltitude"].as_f64();

    let rating = exif_obj["Rating"].as_i64().map(|v| v as i32);

    let user_comment = exif_obj["UserComment"].as_str().map(String::from);
    let description = exif_obj["Description"].as_str()
        .or_else(|| exif_obj["ImageDescription"].as_str())
        .map(String::from);

    let result = ExifData {
        make,
        model,
        lens_model,
        date_time_original,
        film_stock,
        iso,
        aperture,
        shutter_speed,
        focal_length,
        gps_latitude,
        gps_longitude,
        gps_altitude,
        rating,
        user_comment,
        description,
    };

    eprintln!("[EXIF] Extracted data: Make={:?}, Model={:?}, ISO={:?}",
        result.make, result.model, result.iso);

    Ok(result)
}

/// Parse camera string into Make and Model
/// Examples: "Canon AE-1" -> ("Canon", "AE-1")
pub fn parse_camera_string(camera: &str) -> (String, String) {
    let parts: Vec<&str> = camera.split_whitespace().collect();
    if parts.len() >= 2 {
        (parts[0].to_string(), parts[1..].join(" "))
    } else if parts.len() == 1 {
        (camera.to_string(), String::new())
    } else {
        (String::new(), String::new())
    }
}

/// Write roll-level EXIF to a single photo file
pub async fn write_photo_roll_exif(
    file_path: &str,
    make: &str,
    model: &str,
    lens: Option<&str>,
    date_time_original: &str,
    user_comment: &str,
) -> Result<()> {
    eprintln!("[EXIF] Writing roll EXIF to: {}", file_path);
    eprintln!("[EXIF]   Make: {}, Model: {}, Lens: {:?}", make, model, lens);
    eprintln!("[EXIF]   Date: {}, Comment: {}", date_time_original, user_comment);

    if !Path::new(file_path).exists() {
        eprintln!("[EXIF] ERROR: File not found: {}", file_path);
        return Err(anyhow::anyhow!("File not found: {}", file_path));
    }

    let mut cmd = Command::new("exiftool");

    // Overwrite original (don't create backup)
    cmd.arg("-overwrite_original");

    // Clear existing maker notes (to avoid conflicts)
    cmd.arg("-MakerNotes:All=");

    // Write roll-level metadata
    if !make.is_empty() {
        cmd.arg(format!("-Make={}", make));
    }

    if !model.is_empty() {
        cmd.arg(format!("-Model={}", model));
    }

    if let Some(lens_value) = lens {
        if !lens_value.is_empty() {
            cmd.arg(format!("-LensModel={}", lens_value));
        }
    }

    if !date_time_original.is_empty() {
        cmd.arg(format!("-DateTimeOriginal={}", date_time_original));
        cmd.arg(format!("-CreateDate={}", date_time_original));
    }

    if !user_comment.is_empty() {
        cmd.arg(format!("-UserComment={}", user_comment));
    }

    cmd.arg(file_path);

    // Debug: Print the command
    eprintln!("[EXIF] Command: exiftool {:?}", cmd.get_args().collect::<Vec<_>>());

    let output = cmd.output()
        .map_err(|e| {
            eprintln!("[EXIF] ERROR: Failed to execute exiftool: {}", e);
            anyhow::anyhow!("Failed to execute exiftool: {}", e)
        })?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        eprintln!("[EXIF] ERROR: ExifTool returned error code: {:?}", output.status.code());
        eprintln!("[EXIF]   stderr: {}", error);
        eprintln!("[EXIF]   stdout: {}", stdout);
        return Err(anyhow::anyhow!("ExifTool error: {}", error));
    }

    eprintln!("[EXIF] Successfully wrote roll EXIF");
    Ok(())
}

/// Write photo-level EXIF to a single photo file
pub async fn write_photo_exif(
    file_path: &str,
    exif: &ExifData,
) -> Result<()> {
    eprintln!("[EXIF] Writing photo EXIF to: {}", file_path);

    if !Path::new(file_path).exists() {
        return Err(anyhow::anyhow!("File not found: {}", file_path));
    }

    let mut cmd = Command::new("exiftool");
    cmd.arg("-overwrite_original");

    // Write ISO
    if let Some(iso) = exif.iso {
        cmd.arg(format!("-ISO={}", iso));
    }

    // Write Aperture
    if let Some(ref aperture) = exif.aperture {
        cmd.arg(format!("-FNumber={}", aperture));
    }

    // Write Shutter Speed
    if let Some(ref shutter_speed) = exif.shutter_speed {
        cmd.arg(format!("-ExposureTime={}", shutter_speed));
    }

    // Write Focal Length
    if let Some(ref focal_length) = exif.focal_length {
        cmd.arg(format!("-FocalLength={}", focal_length));
    }

    // Write GPS coordinates
    if let Some(lat) = exif.gps_latitude {
        cmd.arg(format!("-GPSLatitude={}", lat));
    }
    if let Some(lon) = exif.gps_longitude {
        cmd.arg(format!("-GPSLongitude={}", lon));
    }
    if let Some(alt) = exif.gps_altitude {
        cmd.arg(format!("-GPSAltitude={}", alt));
    }

    // Write Rating
    if let Some(rating) = exif.rating {
        cmd.arg(format!("-Rating={}", rating));
    }

    // Write UserComment
    if let Some(ref user_comment) = exif.user_comment {
        cmd.arg(format!("-UserComment={}", user_comment));
    }

    // Write Description
    if let Some(ref description) = exif.description {
        cmd.arg(format!("-Description={}", description));
    }

    cmd.arg(file_path);

    let output = cmd.output()
        .map_err(|e| anyhow::anyhow!("Failed to execute exiftool: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("ExifTool error: {}", error));
    }

    eprintln!("[EXIF] Successfully wrote photo EXIF");
    Ok(())
}

/// Clear all EXIF data from a photo file
pub async fn clear_photo_exif(file_path: &str) -> Result<()> {
    eprintln!("[EXIF] Clearing EXIF from: {}", file_path);

    if !Path::new(file_path).exists() {
        return Err(anyhow::anyhow!("File not found: {}", file_path));
    }

    let output = Command::new("exiftool")
        .arg("-overwrite_original")
        .arg("-all=")
        .arg(file_path)
        .output()
        .map_err(|e| anyhow::anyhow!("Failed to execute exiftool: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("ExifTool error: {}", error));
    }

    eprintln!("[EXIF] Successfully cleared EXIF");
    Ok(())
}

/// Default implementation for ExifData
impl Default for ExifData {
    fn default() -> Self {
        ExifData {
            make: None,
            model: None,
            lens_model: None,
            date_time_original: None,
            film_stock: None,
            iso: None,
            aperture: None,
            shutter_speed: None,
            focal_length: None,
            gps_latitude: None,
            gps_longitude: None,
            gps_altitude: None,
            rating: None,
            user_comment: None,
            description: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_camera_string() {
        assert_eq!(
            parse_camera_string("Canon AE-1"),
            ("Canon".to_string(), "AE-1".to_string())
        );
        assert_eq!(
            parse_camera_string("Nikon FM2"),
            ("Nikon".to_string(), "FM2".to_string())
        );
        assert_eq!(
            parse_camera_string("Leica"),
            ("Leica".to_string(), String::new())
        );
    }

    #[test]
    fn test_exif_data_default() {
        let exif = ExifData::default();
        assert!(exif.make.is_none());
        assert!(exif.model.is_none());
        assert!(exif.iso.is_none());
    }
}
