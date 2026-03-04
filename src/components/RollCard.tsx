'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FilmStripBadge } from './FilmStripBadge';
import { formatDate } from '@/lib/utils';
import { useImageAsset } from '@/hooks/useImageAsset';
import type { Roll, Photo } from '@/types/roll';
import type { FilmPreset } from '@/types/film-preset';
import { Edit, Calendar, Camera, Check, Film } from 'lucide-react';

interface RollCardProps {
  roll: Roll;
  coverPhoto?: Photo;
  photoCount?: number;
  preset?: FilmPreset;
  onEdit: (roll: Roll) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelection?: (rollId: number) => void;
  index?: number;
}

export function RollCard({
  roll,
  coverPhoto,
  photoCount,
  preset,
  onEdit,
  selectionMode = false,
  selected = false,
  onToggleSelection,
  index = 0,
}: RollCardProps) {
  const router = useRouter();

  // Use useImageAsset for cover image loading
  const { url: coverImageUrl, isLoading, hasError } = useImageAsset(coverPhoto?.thumbnail_path);
  
  // Use useImageAsset for preset image loading
  const { url: presetImageUrl } = useImageAsset(preset?.image_path);

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
      className={`roll-card ${selected ? 'selected' : ''} item group`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Image Container with Film Frame Effect */}
      <div className="roll-card-image film-frame">
        {isLoading ? (
          <div className="h-full w-full loading-skeleton" />
        ) : hasError || !coverImageUrl ? (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <span className="text-4xl filter grayscale opacity-30">🎞️</span>
          </div>
        ) : (
          <img
            src={coverImageUrl}
            alt={roll.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              console.error('[RollCard', roll.id, '] Image load error:', e);
            }}
          />
        )}

        {/* Selection Indicator Overlay */}
        <div 
          className={`absolute inset-0 bg-color-brand/20 transition-opacity duration-300 pointer-events-none ${
            selected ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Top-left Badge (Selection or Film Stock) */}
        <div className="roll-card-badge">
          {selected ? (
            <div
              className="w-8 h-8 rounded-full bg-color-brand flex items-center justify-center shadow-glow animate-scale-in"
            >
              <Check className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="animate-fade-in">
              <FilmStripBadge filmStock={roll.film_stock} />
            </div>
          )}
        </div>

        {/* Preset Image Badge - Bottom Right */}
        {!selectionMode && !selected && (presetImageUrl || preset?.brand_color) && (
          <div className="absolute bottom-2 right-2 z-10 animate-fade-in-up">
            <div 
              className={`relative w-14 h-14 rounded-md overflow-hidden border border-white/20 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-2 group-hover:translate-y-[-4px] ${
                !presetImageUrl ? (preset?.brand_color || 'bg-surface') : ''
              }`}
              title={preset?.name}
            >
              {presetImageUrl ? (
                <img 
                  src={presetImageUrl} 
                  alt={preset?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-40">
                  <Film className="w-6 h-6 text-white" />
                </div>
              )}
              {/* Cinematic Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30" />
            </div>
          </div>
        )}

        {/* Edit Button - Only visible on hover */}
        {!selectionMode && (
          <div className="roll-card-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(roll);
              }}
              className="roll-card-action-btn hover:bg-color-brand hover:border-color-brand transition-colors"
              title="编辑胶卷"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="roll-card-content">
        {/* Roll Name */}
        <h3 className="roll-card-title group-hover:text-color-brand transition-colors">
          {roll.name}
        </h3>

        {/* Metadata */}
        <div className="roll-card-meta">
          {/* Date */}
          <div className="meta-item">
            <Calendar className="h-3.5 w-3.5 opacity-50" />
            <span>{formatDate(roll.shoot_date)}</span>
          </div>

          {/* Camera */}
          <div className="meta-item">
            <Camera className="h-3.5 w-3.5 opacity-50" />
            <span className="truncate max-w-[120px]">{roll.camera}</span>
          </div>

          {/* Photo Count Badge (Small and subtle) */}
          {photoCount !== undefined && photoCount > 0 && (
            <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface border border-subtle text-[10px] font-mono text-tertiary">
              <span className="font-bold text-secondary">{photoCount}</span>
              <span>PHOTOS</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
