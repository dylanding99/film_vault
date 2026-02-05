import { invoke } from '@tauri-apps/api/core';
import type {
  Roll,
  Photo,
  RollWithPhotos,
  ImportOptions,
  ImportResult,
  UpdateRollRequest,
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
export async function deleteRoll(id: number): Promise<boolean> {
  return await invoke<boolean>('delete_roll_command', { id });
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
