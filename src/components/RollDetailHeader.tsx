'use client';

import { ArrowLeft, Edit, Calendar, Camera, Trash2, Plus, Info } from 'lucide-react';
import { Button } from './ui/button';
import { FilmStripBadge } from './FilmStripBadge';
import { formatDate } from '@/lib/utils';
import { useImageAsset } from '@/hooks/useImageAsset';
import type { Roll } from '@/types/roll';
import type { FilmPreset } from '@/types/film-preset';
import { iconSizes } from '@/styles/design-tokens';

interface RollDetailHeaderProps {
  roll: Roll;
  photoCount: number;
  preset?: FilmPreset;
  onBack: () => void;
  onEdit: (roll: Roll) => void;
  onDelete?: (roll: Roll) => void;
  onAddPhotos?: () => void;
}

export function RollDetailHeader({
  roll,
  photoCount,
  preset,
  onBack,
  onEdit,
  onDelete,
  onAddPhotos,
}: RollDetailHeaderProps) {
  // Use useImageAsset for preset image loading
  const { url: presetImageUrl } = useImageAsset(preset?.image_path);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-6 pb-4 bg-surface/40 backdrop-blur-2xl border-b border-white/5 transition-all duration-500">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-6">
            {/* Back Button with integrated design */}
            <div className="mt-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="flex gap-6 items-center">
              {/* Cinematic Preset Card Mini - A beautiful visual anchor */}
              {(presetImageUrl || preset?.brand_color) && (
                <div className="hidden sm:block relative w-16 h-20 rounded-lg overflow-hidden border border-white/10 shadow-2xl rotate-[-2deg] hover:rotate-0 transition-all duration-500 group film-frame">
                  {presetImageUrl ? (
                    <img 
                      src={presetImageUrl} 
                      alt={preset?.name}
                      className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
                    />
                  ) : (
                    <div className={`w-full h-full ${preset?.brand_color || 'bg-elevated'} flex items-center justify-center`}>
                      <span className="text-[10px] font-mono font-bold text-white/50 vertical-text tracking-widest uppercase">
                        {preset?.brand || 'FILM'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="text-[8px] font-mono text-white/80 truncate uppercase tracking-tighter">
                      {preset?.format}MM
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary tracking-tight">
                    {roll.name}
                  </h1>
                  <FilmStripBadge filmStock={roll.film_stock} className="py-1.5 px-3 h-fit" />
                </div>
                
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2 text-xs font-mono text-secondary/70 uppercase tracking-[0.15em] bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    <Calendar className="w-3.5 h-3.5 opacity-50" />
                    <span>{formatDate(roll.shoot_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-secondary/70 uppercase tracking-[0.15em] bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    <Camera className="w-3.5 h-3.5 opacity-50" />
                    <span className="max-w-[150px] truncate">{roll.camera}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-color-brand bg-color-brand/10 px-2.5 py-1 rounded-md border border-color-brand/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-color-brand animate-pulse" />
                    {photoCount} PHOTOS
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-1">
            <div className="flex p-1 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
              {onAddPhotos && (
                <Button
                  onClick={onAddPhotos}
                  variant="ghost"
                  className="h-10 px-4 gap-2 text-sm text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加照片</span>
                </Button>
              )}
              <Button
                onClick={() => onEdit(roll)}
                variant="ghost"
                className="h-10 px-4 gap-2 text-sm text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <Edit className="w-4 h-4" />
                <span>编辑信息</span>
              </Button>
            </div>

            {onDelete && (
              <Button
                onClick={() => onDelete(roll)}
                variant="ghost"
                className="h-10 w-10 p-0 text-tertiary hover:text-accent-rose hover:bg-accent-rose/10 border border-transparent hover:border-accent-rose/20 rounded-lg transition-all"
                title="删除胶卷"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
