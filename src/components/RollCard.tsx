'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FilmStripBadge } from './FilmStripBadge';
import { pathToAssetUrl, formatDate } from '@/lib/utils';
import type { Roll, Photo } from '@/types/roll';
import { Edit, Calendar, Camera, Check } from 'lucide-react';
import { Button } from './ui/button';

interface RollCardProps {
  roll: Roll;
  coverPhoto?: Photo;
  photoCount?: number;
  onEdit: (roll: Roll) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelection?: (rollId: number) => void;
}

export function RollCard({
  roll,
  coverPhoto,
  photoCount,
  onEdit,
  selectionMode = false,
  selected = false,
  onToggleSelection,
}: RollCardProps) {
  const router = useRouter();
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (coverPhoto?.thumbnail_path) {
      console.log('[RollCard', roll.id, '] Converting thumbnail_path:', coverPhoto.thumbnail_path);
      pathToAssetUrl(coverPhoto.thumbnail_path)
        .then(url => {
          console.log('[RollCard', roll.id, '] Converted URL:', url);
          setCoverImageUrl(url);
        })
        .catch(err => {
          console.error('[RollCard', roll.id, '] Failed to convert URL:', err);
        });
    }
  }, [coverPhoto, roll.id]);

  const handleClick = () => {
    if (selectionMode && onToggleSelection) {
      onToggleSelection(roll.id);
    } else {
      router.push(`/rolls/${roll.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-lg border transition-all cursor-pointer ${
        selected
          ? 'border-blue-500 bg-blue-950/30'
          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      {/* Cover Image */}
      <div className="aspect-[3/2] overflow-hidden bg-zinc-950">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={roll.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              console.error('[RollCard', roll.id, '] Image load error:', e);
              console.error('[RollCard', roll.id, '] Image src:', coverImageUrl);
            }}
            onLoad={() => {
              console.log('[RollCard', roll.id, '] Image loaded successfully');
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-zinc-700 text-6xl">🎞️</div>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-3 left-3 p-2 rounded-full bg-blue-500">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Film Stock Badge */}
      {!selected && (
        <div className="absolute top-3 left-3">
          <FilmStripBadge filmStock={roll.film_stock} />
        </div>
      )}

      {/* Edit Button */}
      {!selectionMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(roll);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          title="编辑胶卷"
        >
          <Edit className="h-4 w-4" />
        </button>
      )}

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Roll Name */}
        <h3 className="font-semibold text-white truncate">{roll.name}</h3>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-zinc-400">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(roll.shoot_date)}</span>
          </div>

          {/* Camera */}
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className="truncate">{roll.camera}</span>
            {roll.lens && (
              <>
                <span>·</span>
                <span className="truncate">{roll.lens}</span>
              </>
            )}
            {photoCount !== undefined && photoCount > 0 && (
              <>
                <span>·</span>
                <span className="text-zinc-500">{photoCount} 张</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
