import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { invoke } from "@tauri-apps/api/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Convert a local file path to a base64 data URL
 * Uses Rust backend to read the file and return base64 encoded data
 */
export async function pathToAssetUrl(path: string): Promise<string> {
  try {
    const dataUrl = await invoke<string>('read_image_as_base64', { path });
    return dataUrl;
  } catch (error) {
    console.error('Failed to convert file to data URL:', error);
    throw error;
  }
}
