'use client';

import { useState, useEffect } from 'react';
import { Check, Heart } from 'lucide-react';
import { pathToAssetUrl } from '@/lib/utils';
import type { Photo } from '@/types/roll';

interface PhotoGridItemProps {
  photo: Photo;
  index: number;
  isSelected: boolean;
  onClick: (photo: Photo, index: number) => void;
  onToggleSelect: (photoId: number) => void;
  onToggleFavorite: (photoId: number) => void;
}

export function PhotoGridItem({
  photo,
  index,
  isSelected,
  onClick,
  onToggleSelect,
  onToggleFavorite,
}: PhotoGridItemProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (photo.thumbnail_path) {
      console.log('[PhotoGridItem', photo.id, '] Converting thumbnail_path:', photo.thumbnail_path);
      pathToAssetUrl(photo.thumbnail_path)
        .then(url => {
          console.log('[PhotoGridItem', photo.id, '] Converted URL:', url);
          setThumbnailUrl(url);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('[PhotoGridItem', photo.id, '] Failed to convert URL:', err);
          setHasError(true);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [photo.thumbnail_path, photo.id]);

  const handleClick = (e: React.MouseEvent) => {
    // Ctrl+Click for selection
    if (e.ctrlKey || e.metaKey) {
      onToggleSelect(photo.id);
    } else {
      onClick(photo, index);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative aspect-square overflow-hidden rounded-lg border-2 transition-all cursor-pointer
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/50'
          : 'border-zinc-800 hover:border-zinc-700'
        }
      `}
    >
      {/* Thumbnail Image */}
      {isLoading ? (
        <div className="h-full w-full bg-zinc-900 animate-pulse" />
      ) : hasError || !thumbnailUrl ? (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900">
          <div className="text-zinc-700 text-4xl">📷</div>
        </div>
      ) : (
        <img
          src={thumbnailUrl}
          alt={photo.filename}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            console.error('[PhotoGridItem', photo.id, '] Image load error');
            setHasError(true);
          }}
        />
      )}

      {/* Cover Badge */}
      {photo.is_cover && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
          Cover
        </div>
      )}

      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
          <div className="p-2 rounded-full bg-blue-500">
            <Check className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      {!isSelected && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Selection Checkbox (visible on hover or when selected) */}
      <div
        className={`
          absolute top-2 left-2 p-1.5 rounded transition-all
          ${isSelected
            ? 'bg-blue-500'
            : 'opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-sm'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(photo.id);
        }}
      >
        {isSelected ? (
          <Check className="h-3 w-3 text-white" />
        ) : (
          <div className="h-3 w-3 border-2 border-white rounded-sm" />
        )}
      </div>

      {/* Favorite Heart Button */}
      <div
        className={`
          absolute bottom-2 right-2 p-2 rounded-full transition-all cursor-pointer
          ${photo.is_favorite
            ? 'bg-red-500/90 text-white scale-110'
            : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(photo.id);
        }}
      >
        <Heart
          className={`h-4 w-4 ${photo.is_favorite ? 'fill-current' : ''}`}
        />
      </div>
    </div>
  );
}
