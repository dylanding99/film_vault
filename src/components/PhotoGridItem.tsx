'use client';

import { Check, Heart } from 'lucide-react';
import { useImageAsset } from '@/hooks/useImageAsset';
import { colors, iconSizes } from '@/styles/design-tokens';
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
  // Use useImageAsset for thumbnail loading
  const { url: thumbnailUrl, isLoading, hasError } = useImageAsset(photo.thumbnail_path);

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
        group relative aspect-square overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer animate-fade-in-up
        ${isSelected
          ? 'border-color-brand ring-2 ring-color-brand/30 shadow-glow'
          : 'border-subtle hover:border-default bg-surface'
        }
      `}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Thumbnail Image with Film Frame effect on hover */}
      <div className={`h-full w-full transition-transform duration-500 ${isSelected ? 'scale-[0.9]' : 'group-hover:scale-105'}`}>
        {isLoading ? (
          <div className="h-full w-full loading-skeleton" />
        ) : hasError || !thumbnailUrl ? (
          <div className="flex h-full w-full items-center justify-center bg-deep">
            <div className="text-tertiary opacity-20 text-4xl">📷</div>
          </div>
        ) : (
          <img
            src={thumbnailUrl}
            alt={photo.filename}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              console.error('[PhotoGridItem', photo.id, '] Image load error:', e);
            }}
          />
        )}
      </div>

      {/* Cover Badge */}
      {photo.is_cover && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-color-brand text-white text-[10px] font-bold font-mono tracking-wider shadow-glow">
          COVER
        </div>
      )}

      {/* Selection Overlay */}
      <div 
        className={`absolute inset-0 bg-color-brand/10 transition-opacity duration-300 pointer-events-none ${
          isSelected ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Selection Checkbox (visible on hover or when selected) */}
      <div
        className={`
          absolute top-3 left-3 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300
          ${isSelected
            ? 'bg-color-brand shadow-glow scale-110'
            : 'opacity-0 group-hover:opacity-100 bg-surface/60 backdrop-blur-md border border-white/20'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(photo.id);
        }}
      >
        {isSelected ? (
          <Check className="w-4 h-4 text-white" />
        ) : (
          <div className="w-2.5 h-2.5 rounded-sm border border-white/40" />
        )}
      </div>

      {/* Favorite Heart Button */}
      <div
        className={`
          absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer
          ${photo.is_favorite
            ? 'bg-accent-rose text-white shadow-lg shadow-rose-900/20 scale-110'
            : 'bg-surface/60 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(photo.id);
        }}
      >
        <Heart
          className={`w-4 h-4 ${photo.is_favorite ? 'fill-current' : ''}`}
        />
      </div>

      {/* Index Badge (Subtle, only on hover) */}
      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
        <span className="font-mono text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded">
          {index + 1}
        </span>
      </div>
    </div>
  );
}
