'use client';

import { ArrowLeft, Edit, Calendar, Camera, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { FilmStripBadge } from './FilmStripBadge';
import { formatDate } from '@/lib/utils';
import type { Roll } from '@/types/roll';

interface RollDetailHeaderProps {
  roll: Roll;
  photoCount: number;
  onBack: () => void;
  onEdit: (roll: Roll) => void;
  onDelete?: (roll: Roll) => void;
}

export function RollDetailHeader({
  roll,
  photoCount,
  onBack,
  onEdit,
  onDelete,
}: RollDetailHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        {/* Top Row: Back Button and Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{roll.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <FilmStripBadge filmStock={roll.film_stock} />
                <span className="text-sm text-zinc-500">
                  {photoCount} 张照片
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => onEdit(roll)}
              variant="outline"
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              编辑
            </Button>
            {onDelete && (
              <Button
                onClick={() => onDelete(roll)}
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Row: Metadata */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(roll.shoot_date)}</span>
          </div>

          {/* Camera */}
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>{roll.camera}</span>
            {roll.lens && (
              <>
                <span>·</span>
                <span>{roll.lens}</span>
              </>
            )}
          </div>

          {/* Lab Info */}
          {roll.lab_info && (
            <div className="flex items-center gap-2">
              <span>Lab: {roll.lab_info}</span>
            </div>
          )}

          {/* Notes */}
          {roll.notes && (
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="line-clamp-1">{roll.notes}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
