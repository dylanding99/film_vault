import { FilmPreset } from '@/types/film-preset';
import { Edit, Trash2, Check } from 'lucide-react';
import { useImageAsset } from '@/hooks/useImageAsset';
import { iconSizes } from '@/styles/design-tokens';

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
  // Use useImageAsset for image loading
  const { url: imageData, isLoading: isImageLoading, hasError: imageError } = useImageAsset(preset.image_path);

  return (
    <div
      className={`relative aspect-square w-full max-w-[160px] rounded-xl overflow-hidden cursor-pointer transition-all duration-500 group animate-fade-in-up ${
        onClick ? 'hover:scale-[1.05] active:scale-[0.98]' : ''
      } ${selected ? 'ring-2 ring-color-brand ring-offset-4 ring-offset-bg-deep shadow-glow' : 'border border-subtle hover:border-default'}`}
      onClick={onClick}
    >
      {/* Background: Image or Brand Color with Film Frame effect */}
      <div className="absolute inset-0 film-frame">
        {imageData && !imageError ? (
          <img 
            src={imageData} 
            alt={preset.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : isImageLoading ? (
          <div className="absolute inset-0 bg-surface flex items-center justify-center">
            <div className="loading-skeleton w-full h-full" />
          </div>
        ) : (
          <div className={`absolute inset-0 ${preset.brand_color || 'bg-surface'} transition-colors`}>
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
            }} />
          </div>
        )}
        
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      </div>

      {/* Content Layer */}
      <div className="absolute inset-0 flex flex-col justify-between p-3 z-10">
        {/* Top: Format & Actions */}
        <div className="flex justify-between items-start">
          <div className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-mono font-bold text-white tracking-widest uppercase">
            {preset.format}
          </div>

          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-4px] group-hover:translate-y-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white backdrop-blur-md border border-white/10 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1.5 bg-accent-rose/20 hover:bg-accent-rose rounded-md text-white backdrop-blur-md border border-accent-rose/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Brand & Name */}
        <div className="space-y-0.5 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
          <div className="text-[10px] text-white/50 font-mono uppercase tracking-[0.15em] line-clamp-1">
            {preset.brand}
          </div>
          <div className="text-white text-xs font-medium leading-tight line-clamp-2 font-body group-hover:text-color-brand transition-colors">
            {preset.name}
          </div>
        </div>
      </div>

      {/* Selected indicator (Top right) */}
      {selected && (
        <div className="absolute top-2 right-2 z-20 animate-scale-in">
          <div className="bg-color-brand rounded-full p-1 shadow-glow">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
