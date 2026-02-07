/**
 * FilmVault EXIF Info Panel
 *
 * Displays EXIF metadata for a photo
 * Shows formatted values like f/2.8, 1/125s, 50mm, etc.
 */

'use client';

import type { Photo } from '@/types/roll';
import type { ExifData } from '@/types/exif';

interface ExifInfoPanelProps {
  photo: Photo;
  exifData: ExifData | null;
}

/**
 * Format aperture value for display
 */
function formatAperture(aperture?: string): string {
  if (!aperture) return '-';
  // Already in format like "f/2.8" or "2.8"
  return aperture.startsWith('f/') ? aperture : `f/${aperture}`;
}

/**
 * Format shutter speed for display
 */
function formatShutterSpeed(shutter?: string): string {
  if (!shutter) return '-';
  // Already in format like "1/125" or "1/125s"
  return shutter.replace('s', '') + 's';
}

/**
 * Format focal length for display
 */
function formatFocalLength(focalLength?: string): string {
  if (!focalLength) return '-';
  // Already in format like "50mm"
  return focalLength;
}

/**
 * Format GPS coordinates for display
 */
function formatGPS(lat?: number | null, lon?: number | null): string {
  if (lat == null || lon == null) return '-';
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

export function ExifInfoPanel({ photo, exifData }: ExifInfoPanelProps) {
  // Check if any EXIF data exists
  const hasExifData = exifData && (
    exifData.iso ||
    exifData.aperture ||
    exifData.shutter_speed ||
    exifData.focal_length ||
    exifData.user_comment ||
    exifData.description ||
    (photo.lat != null && photo.lon != null)
  );

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">EXIF 信息</h3>
        <span className="text-xs text-zinc-500">拍摄参数</span>
      </div>

      {!hasExifData ? (
        <div className="text-center py-4 text-zinc-500 text-sm">
          <p>暂无 EXIF 数据</p>
          <p className="text-xs mt-1">点击"编辑 EXIF"添加拍摄参数</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* ISO */}
          {exifData?.iso && (
            <div className="flex justify-between">
              <span className="text-zinc-400">ISO</span>
              <span className="text-zinc-100 font-medium">{exifData.iso}</span>
            </div>
          )}

          {/* Aperture */}
          {exifData?.aperture && (
            <div className="flex justify-between">
              <span className="text-zinc-400">光圈</span>
              <span className="text-zinc-100 font-medium">
                {formatAperture(exifData.aperture)}
              </span>
            </div>
          )}

          {/* Shutter Speed */}
          {exifData?.shutter_speed && (
            <div className="flex justify-between">
              <span className="text-zinc-400">快门</span>
              <span className="text-zinc-100 font-medium">
                {formatShutterSpeed(exifData.shutter_speed)}
              </span>
            </div>
          )}

          {/* Focal Length */}
          {exifData?.focal_length && (
            <div className="flex justify-between">
              <span className="text-zinc-400">焦距</span>
              <span className="text-zinc-100 font-medium">
                {formatFocalLength(exifData.focal_length)}
              </span>
            </div>
          )}

          {/* GPS Coordinates */}
          {(photo.lat != null && photo.lon != null) && (
            <div className="flex justify-between col-span-2">
              <span className="text-zinc-400">GPS</span>
              <span className="text-zinc-100 font-medium">
                {formatGPS(photo.lat, photo.lon)}
              </span>
            </div>
          )}

          {/* Description */}
          {exifData?.description && (
            <div className="col-span-2">
              <div className="text-zinc-400 mb-1">描述</div>
              <div className="text-zinc-100 text-xs bg-zinc-800/50 rounded p-2">
                {exifData.description}
              </div>
            </div>
          )}

          {/* User Comment */}
          {exifData?.user_comment && (
            <div className="col-span-2">
              <div className="text-zinc-400 mb-1">备注</div>
              <div className="text-zinc-100 text-xs bg-zinc-800/50 rounded p-2">
                {exifData.user_comment}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXIF Sync Status */}
      <div className="pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">EXIF 同步状态</span>
          <span className={`font-medium ${photo.exif_synced ? 'text-green-400' : 'text-yellow-400'}`}>
            {photo.exif_synced ? '已同步' : '未同步'}
          </span>
        </div>
        {photo.exif_written_at && (
          <div className="text-xs text-zinc-600 mt-1">
            写入时间: {new Date(photo.exif_written_at).toLocaleString('zh-CN')}
          </div>
        )}
      </div>
    </div>
  );
}
