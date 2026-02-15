/**
 * FilmVault EXIF Types
 *
 * Type definitions for EXIF metadata operations
 * Simplified version: only Make, Model, DateTimeOriginal, and UserComment
 */

/**
 * EXIF data structure for reading EXIF from photos
 */
export interface ExifData {
  // Roll-level fields (from roll metadata)
  make?: string;              // Camera manufacturer (e.g., "Canon")
  model?: string;             // Camera model (e.g., "AE-1")
  lens_model?: string;        // Lens model (e.g., "FD 50mm f/1.4")
  date_time_original?: string; // Shooting date in EXIF format (YYYY:MM:DD HH:MM:SS)
  film_stock?: string;        // Film stock name (e.g., "Kodak Portra 400")

  // Photo-level fields
  user_comment?: string;      // User comment (notes)

  // Legacy fields (kept for reading from existing photos, but not written)
  iso?: number;
  aperture?: string;
  shutter_speed?: string;
  focal_length?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  gps_altitude?: number;
  rating?: number;
  description?: string;
  gps_city?: string;
  gps_country?: string;
}

/**
 * Result of EXIF write operation
 * Contains statistics about the write operation
 */
export interface ExifWriteResult {
  success_count: number;      // Number of successfully written files
  failed_count: number;       // Number of failed files
  failed_files: string[];     // List of failed file paths with error messages
}

/**
 * Request structure for writing roll EXIF
 */
export interface WriteRollExifRequest {
  roll_id: number;            // Roll ID to write EXIF for
  auto_write: boolean;        // Whether to automatically write EXIF
}

/**
 * Request structure for writing photo EXIF
 * Writes UserComment in format: "Shot on {film_stock} | {city}, {country} | {user_comment}"
 * - film_stock: from roll (required)
 * - location: photo location takes priority, falls back to roll location
 * - user_comment: user's notes for this photo
 */
export interface WritePhotoExifRequest {
  photo_id: number;           // Photo ID to write EXIF for
  user_comment?: string;      // User comment (notes) to write
}
