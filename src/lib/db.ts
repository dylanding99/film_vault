import { invoke } from '@tauri-apps/api/core';
import type {
  Roll,
  Photo,
  RollWithPhotos,
  ImportOptions,
  ImportResult,
  UpdateRollRequest,
  AppConfig,
  DeleteRollRequest,
  DeletePhotosRequest,
} from '@/types/roll';
import type {
  ExifData,
  ExifWriteResult,
  WriteRollExifRequest,
  WritePhotoExifRequest,
} from '@/types/exif';

/**
 * Get all rolls from the database
 */
export async function getAllRolls(): Promise<Roll[]> {
  return await invoke<Roll[]>('get_all_rolls_command');
}

/**
 * Get a roll by ID
 */
export async function getRollById(id: number): Promise<Roll | null> {
  return await invoke<Roll | null>('get_roll_by_id_command', { id });
}

/**
 * Get a roll with all its photos
 */
export async function getRollWithPhotos(id: number): Promise<RollWithPhotos> {
  return await invoke<RollWithPhotos>('get_roll_with_photos', { id });
}

/**
 * Update roll metadata
 */
export async function updateRoll(request: UpdateRollRequest): Promise<boolean> {
  return await invoke<boolean>('update_roll_command', { request });
}

/**
 * Delete a roll
 */
export async function deleteRoll(request: DeleteRollRequest): Promise<boolean> {
  return await invoke<boolean>('delete_roll_command', { request });
}

/**
 * Import a folder as a new roll
 */
export async function importFolder(options: ImportOptions): Promise<ImportResult> {
  return await invoke<ImportResult>('import_folder', { options });
}

/**
 * Preview import count
 */
export async function previewImportCount(sourcePath: string): Promise<number> {
  return await invoke<number>('preview_import_count', { sourcePath });
}

/**
 * Set a photo as the roll cover
 */
export async function setPhotoAsCover(rollId: number, photoId: number): Promise<boolean> {
  return await invoke<boolean>('set_photo_as_cover_command', {
    rollId,
    photoId,
  });
}

/**
 * Update photo rating
 */
export async function updatePhotoRating(photoId: number, rating: number): Promise<boolean> {
  return await invoke<boolean>('update_photo_rating_command', {
    photoId,
    rating,
  });
}

/**
 * Update photo location
 */
export async function updatePhotoLocation(
  photoId: number,
  lat: number,
  lon: number,
): Promise<boolean> {
  return await invoke<boolean>('update_photo_location_command', {
    photoId,
    lat,
    lon,
  });
}

/**
 * Get photos by roll ID
 */
export async function getPhotosByRoll(rollId: number): Promise<Photo[]> {
  return await invoke<Photo[]>('get_photos_by_roll_command', { rollId });
}

/**
 * Get application configuration
 */
export async function getConfig(): Promise<AppConfig> {
  return await invoke<AppConfig>('get_config');
}

/**
 * Get library root path
 */
export async function getLibraryRoot(): Promise<string> {
  const config = await getConfig();
  return config.library_root;
}

/**
 * Update library root path
 */
export async function updateLibraryRoot(path: string): Promise<boolean> {
  return await invoke<boolean>('update_library_root', { path });
}

/**
 * Delete a single photo
 */
export async function deletePhoto(photoId: number, deleteFiles: boolean): Promise<boolean> {
  return await invoke<boolean>('delete_photo_command', {
    photoId,
    deleteFiles,
  });
}

/**
 * Batch delete photos
 */
export async function deletePhotos(request: DeletePhotosRequest): Promise<number> {
  return await invoke<number>('delete_photos_command', { request });
}

/**
 * Toggle photo favorite status
 */
export async function togglePhotoFavorite(photoId: number): Promise<boolean> {
  return await invoke<boolean>('toggle_photo_favorite_command', {
    photoId,
  });
}

/**
 * Update photo favorite status
 */
export async function updatePhotoFavorite(photoId: number, isFavorite: boolean): Promise<boolean> {
  return await invoke<boolean>('update_photo_favorite_command', {
    photoId,
    isFavorite,
  });
}

/**
 * Get favorite photos by roll ID
 */
export async function getFavoritePhotosByRoll(rollId: number): Promise<Photo[]> {
  return await invoke<Photo[]>('get_favorite_photos_by_roll_command', { rollId });
}

// ==================== EXIF Functions ====================

/**
 * Check if ExifTool is available
 * Returns true if ExifTool is installed and accessible
 */
export async function checkExifToolAvailable(): Promise<boolean> {
  return await invoke<boolean>('check_exiftool_available_command');
}

/**
 * Write roll-level EXIF to all photos in a roll
 * Writes camera, lens, date, and film stock metadata to all photo files
 */
export async function writeRollExif(request: WriteRollExifRequest): Promise<ExifWriteResult> {
  return await invoke<ExifWriteResult>('write_roll_exif_command', { request });
}

/**
 * Write photo-level EXIF to a single photo
 * Writes ISO, aperture, shutter speed, focal length, GPS, etc.
 */
export async function writePhotoExif(request: WritePhotoExifRequest): Promise<boolean> {
  return await invoke<boolean>('write_photo_exif_command', { request });
}

/**
 * Clear EXIF from a single photo
 * Removes all EXIF metadata from a photo file
 */
export async function clearPhotoExif(photoId: number): Promise<boolean> {
  return await invoke<boolean>('clear_photo_exif_command', { photoId });
}

/**
 * Clear EXIF from all photos in a roll
 * Removes all EXIF metadata from all photo files in a roll
 */
export async function clearRollExif(rollId: number): Promise<ExifWriteResult> {
  return await invoke<ExifWriteResult>('clear_roll_exif_command', { rollId });
}

/**
 * Read EXIF from a single photo file
 * Extracts all EXIF metadata from the photo
 */
export async function readPhotoExif(photoId: number): Promise<ExifData> {
  return await invoke<ExifData>('read_photo_exif_command', { photoId });
}

