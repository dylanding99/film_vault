/**
 * FilmVault EXIF Types
 *
 * Type definitions for EXIF metadata operations
 */

/**
 * EXIF data structure for reading EXIF from photos
 * Contains both roll-level and photo-level metadata
 */
export interface ExifData {
  // Roll-level fields (from roll metadata)
  make?: string;              // Camera manufacturer (e.g., "Canon")
  model?: string;             // Camera model (e.g., "AE-1")
  lens_model?: string;        // Lens model (e.g., "FD 50mm f/1.4")
  date_time_original?: string; // Shooting date in EXIF format (YYYY:MM:DD HH:MM:SS)
  film_stock?: string;        // Film stock name (e.g., "Kodak Portra 400")

  // Photo-level fields (shot-specific)
  iso?: number;               // ISO sensitivity
  aperture?: string;          // Aperture (e.g., "f/2.8", "f/1.4")
  shutter_speed?: string;     // Shutter speed (e.g., "1/125", "1/500")
  focal_length?: string;      // Focal length (e.g., "50mm", "35mm")
  gps_latitude?: number;      // GPS latitude coordinate
  gps_longitude?: number;     // GPS longitude coordinate
  gps_altitude?: number;      // GPS altitude in meters
  rating?: number;            // Photo rating (0-5)
  user_comment?: string;      // User comment
  description?: string;       // Photo description
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
 */
export interface WritePhotoExifRequest {
  photo_id: number;           // Photo ID to write EXIF for
  exif_data: ExifData;        // EXIF data to write
}
