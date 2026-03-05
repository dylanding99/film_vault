'use client';

import { Button } from './ui/button';
import { Check, X, Trash2 } from 'lucide-react';
import { iconSizes } from '@/styles/design-tokens';

interface BatchSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClearSelection: () => void;
  onDelete?: () => void;
  itemType?: 'photo' | 'roll';
}

export function BatchSelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onClearSelection,
  onDelete,
  itemType = 'photo',
}: BatchSelectionBarProps) {
  const itemText = itemType === 'photo' ? '张照片' : '个胶卷';
  const deleteText = itemType === 'photo' ? '删除照片' : '删除胶卷';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up">
      {/* Background with Blur */}
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-xl border-t border-subtle" />
      
      <div className="container relative mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-color-brand shadow-glow animate-scale-in">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 font-display text-lg">
                  <span className="font-semibold text-primary">{selectedCount}</span>
                  <span className="text-secondary">{itemText} 已选</span>
                </div>
                <p className="text-[10px] font-mono text-tertiary tracking-widest uppercase">
                  Batch Action Mode
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-subtle hidden sm:block" />

            {selectedCount < totalCount ? (
              <Button
                onClick={onSelectAll}
                variant="ghost"
                size="sm"
                className="btn-ghost text-xs text-secondary hover:text-primary transition-colors"
              >
                全选本页 ({totalCount})
              </Button>
            ) : (
              <Button
                onClick={onDeselectAll}
                variant="ghost"
                size="sm"
                className="btn-ghost text-xs text-color-brand hover:text-color-brand-bright"
              >
                取消全选
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={onClearSelection}
              variant="outline"
              size="sm"
              className="btn-secondary gap-2 flex-1 sm:flex-none"
            >
              <X className="w-4 h-4" />
              <span>退出选择</span>
            </Button>
            {onDelete && (
              <Button
                onClick={onDelete}
                variant="destructive"
                size="sm"
                className="bg-accent-rose hover:bg-red-600 text-white border-none gap-2 flex-1 sm:flex-none shadow-lg shadow-rose-900/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteText}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
