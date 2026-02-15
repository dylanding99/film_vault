'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, X, Heart, Info, Edit, Loader2, MapPin } from 'lucide-react';
import { pathToAssetUrl } from '@/lib/utils';
import type { Photo } from '@/types/roll';
import type { ExifData } from '@/types/exif';
import { ExifInfoPanel } from './ExifInfoPanel';
import { PhotoMetadataForm } from './PhotoMetadataForm';
import { readPhotoExif } from '@/lib/db';

interface PhotoPreviewDialogProps {
  photo: Photo;
  index: number;
  total: number;
  rollId: number;
  rollCity?: string;
  rollCountry?: string;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onSetCover: (rollId: number, photoId: number) => Promise<void>;
  onToggleFavorite: (photoId: number) => Promise<void>;
  onPhotoUpdate?: () => void;
}

export function PhotoPreviewDialog({
  photo,
  index,
  total,
  rollId,
  rollCity,
  rollCountry,
  onClose,
  onNavigate,
  onSetCover,
  onToggleFavorite,
  onPhotoUpdate,
}: PhotoPreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSettingCover, setIsSettingCover] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showExifPanel, setShowExifPanel] = useState(false);
  const [showEditExif, setShowEditExif] = useState(false);
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [isLoadingExif, setIsLoadingExif] = useState(false);
  // Local state to track if current photo is cover (for immediate UI feedback)
  const [isCover, setIsCover] = useState(photo.is_cover);

  // 计算显示的位置（照片优先于胶卷）
  const displayLocation = photo.city && photo.country
    ? { city: photo.city, country: photo.country }
    : rollCity && rollCountry
    ? { city: rollCity, country: rollCountry }
    : null;

  // Sync isCover state when photo prop changes (e.g., when navigating)
  useEffect(() => {
    setIsCover(photo.is_cover);
  }, [photo.id, photo.is_cover]);

  useEffect(() => {
    if (photo.preview_path) {
      console.log('[PhotoPreviewDialog', photo.id, '] Converting preview_path:', photo.preview_path);
      pathToAssetUrl(photo.preview_path)
        .then(url => {
          console.log('[PhotoPreviewDialog', photo.id, '] Converted URL');
          setPreviewUrl(url);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('[PhotoPreviewDialog', photo.id, '] Failed to convert URL:', err);
          setHasError(true);
          setIsLoading(false);
        });
    } else if (photo.file_path) {
      // Fallback to original file
      console.log('[PhotoPreviewDialog', photo.id, '] Converting file_path (fallback):', photo.file_path);
      pathToAssetUrl(photo.file_path)
        .then(url => {
          console.log('[PhotoPreviewDialog', photo.id, '] Converted URL (fallback)');
          setPreviewUrl(url);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('[PhotoPreviewDialog', photo.id, '] Failed to convert URL (fallback):', err);
          setHasError(true);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [photo.preview_path, photo.file_path, photo.id]);

  // Load EXIF data when photo changes or panel opens
  useEffect(() => {
    if (showExifPanel && photo.id) {
      setIsLoadingExif(true);
      readPhotoExif(photo.id)
        .then(data => {
          console.log('[PhotoPreviewDialog] EXIF data loaded:', data);
          setExifData(data);
        })
        .catch(err => {
          console.error('[PhotoPreviewDialog] Failed to load EXIF:', err);
          setExifData(null);
        })
        .finally(() => {
          setIsLoadingExif(false);
        });
    }
  }, [showExifPanel, photo.id]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        onNavigate('next');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, onClose]);

  const handleSetCover = async () => {
    if (isCover) return; // Use local state instead
    setIsSettingCover(true);
    try {
      await onSetCover(rollId, photo.id);
      // Update local state for immediate UI feedback
      setIsCover(true);
    } catch (error) {
      console.error('Failed to set cover:', error);
    } finally {
      setIsSettingCover(false);
    }
  };

  const handleToggleFavorite = async () => {
    setIsTogglingFavorite(true);
    try {
      await onToggleFavorite(photo.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-zinc-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Navigation Buttons */}
        {total > 1 && (
          <>
            <button
              onClick={() => onNavigate('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => onNavigate('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image Container */}
        <div className="flex items-center justify-center min-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="text-zinc-500">Loading...</div>
            </div>
          ) : hasError || !previewUrl ? (
            <div className="flex flex-col items-center justify-center text-zinc-500">
              <div className="text-6xl mb-4">📷</div>
              <div>Failed to load image</div>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={photo.filename}
              className="max-w-full max-h-[80vh] object-contain"
            />
          )}
        </div>

        {/* Photo Info Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-end justify-between gap-4">
            {/* Left: File info and Location */}
            <div className="text-white">
              <div className="font-semibold truncate max-w-md">{photo.filename}</div>
              <div className="text-sm text-zinc-400">
                {index + 1} / {total}
              </div>
              {/* Location Display */}
              {displayLocation && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {displayLocation.city}, {displayLocation.country}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowEditExif(true)}
                size="sm"
                variant="outline"
                className="bg-zinc-800/80 hover:bg-zinc-700/80 border-zinc-600 text-white"
              >
                <Edit className="h-4 w-4 mr-1" />
                编辑 EXIF
              </Button>
              <Button
                onClick={() => setShowExifPanel(!showExifPanel)}
                size="sm"
                variant={showExifPanel ? "default" : "outline"}
                className={showExifPanel ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-800/80 hover:bg-zinc-700/80 border-zinc-600 text-white"}
              >
                <Info className="h-4 w-4 mr-1" />
                {showExifPanel ? '隐藏 EXIF' : 'EXIF 信息'}
              </Button>
              <Button
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                size="sm"
                variant={photo.is_favorite ? "default" : "secondary"}
                className={photo.is_favorite ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <Heart className={`h-4 w-4 mr-1 ${photo.is_favorite ? 'fill-current' : ''}`} />
                {isTogglingFavorite ? '处理中...' : photo.is_favorite ? '已收藏' : '收藏'}
              </Button>
              {!isCover && (
                <Button
                  onClick={handleSetCover}
                  disabled={isSettingCover}
                  size="sm"
                  variant="secondary"
                >
                  {isSettingCover ? 'Setting...' : 'Set as Cover'}
                </Button>
              )}
              {isCover && (
                <div className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium">
                  Cover Photo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EXIF Info Panel */}
        {showExifPanel && (
          <div className="absolute top-4 left-4 w-72">
            {isLoadingExif ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                <span className="ml-2 text-sm text-zinc-400">加载中...</span>
              </div>
            ) : (
              <ExifInfoPanel photo={photo} exifData={exifData} />
            )}
          </div>
        )}

        {/* EXIF Edit Dialog */}
        <PhotoMetadataForm
          photo={photo}
          open={showEditExif}
          onClose={() => setShowEditExif(false)}
          onUpdate={() => {
            setShowEditExif(false);
            // Reload EXIF data if panel is open
            if (showExifPanel) {
              setIsLoadingExif(true);
              readPhotoExif(photo.id)
                .then(data => {
                  console.log('[PhotoPreviewDialog] EXIF data reloaded:', data);
                  setExifData(data);
                })
                .catch(err => {
                  console.error('[PhotoPreviewDialog] Failed to reload EXIF:', err);
                })
                .finally(() => {
                  setIsLoadingExif(false);
                });
            }
            onPhotoUpdate?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
