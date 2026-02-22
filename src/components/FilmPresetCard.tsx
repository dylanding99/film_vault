import { FilmPreset } from '@/types/film-preset';
import { Edit, Trash2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { readImageAsBase64 } from '@/lib/db';

interface FilmPresetCardProps {
  preset: FilmPreset;
  selected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function FilmPresetCard({
  preset,
  selected = false,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
}: FilmPresetCardProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Load image on mount when preset has an image path
  useEffect(() => {
    if (preset.image_path && !imageData && !imageError) {
      loadImage();
    }
  }, [preset.id, preset.image_path]); // Re-run when preset changes

  const loadImage = async () => {
    if (preset.image_path && !imageError) {
      try {
        const data = await readImageAsBase64(preset.image_path);
        setImageData(data);
      } catch (error) {
        console.error('Failed to load preset image:', error);
        setImageError(true);
      }
    }
  };

  return (
    <div
      className={`relative h-48 w-40 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 group ${
        onClick ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900' : ''}`}
      onClick={onClick}
    >
      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-blue-500 rounded-full p-1">
            <Check className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Background: Image or Color */}
      {imageData && !imageError ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageData})` }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
      ) : (
        <div className={`absolute inset-0 ${preset.brand_color}`}>
          {/* Texture overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
          }} />
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-2">
        {/* Top: Actions */}
        {showActions && (
          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 bg-black/50 hover:bg-black/70 rounded text-white backdrop-blur-sm transition-colors"
              >
                <Edit className="h-3 w-3" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 bg-black/50 hover:bg-red-600 rounded text-white backdrop-blur-sm transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Bottom: Info */}
        <div className="space-y-1">
          <div className="text-[10px] text-white/70 font-medium uppercase tracking-wide">
            {preset.format}
          </div>
          <div className="text-[11px] text-white/60 font-medium">
            {preset.brand}
          </div>
          <div className="text-white text-[13px] font-bold leading-tight line-clamp-2">
            {preset.name}
          </div>
        </div>
      </div>
    </div>
  );
}
