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
