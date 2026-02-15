'use client';

import { Button } from './ui/button';
import { Check, X, Trash2 } from 'lucide-react';

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
  const itemText = itemType === 'photo'
    ? (selectedCount === 1 ? '张照片' : '张照片')
    : (selectedCount === 1 ? '个胶卷' : '个胶卷');

  const selectAllText = itemType === 'photo' ? '全选' : '全选';
  const clearText = '取消选择';
  const deleteText = itemType === 'photo' ? '删除照片' : '删除胶卷';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 shadow-lg z-20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Selection Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-500">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div className="text-white">
                <span className="font-semibold">{selectedCount}</span>
                <span className="text-zinc-400 ml-1">
                  {itemText}
                </span>
              </div>
            </div>

            {selectedCount < totalCount ? (
              <Button
                onClick={onSelectAll}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
              >
                {selectAllText} ({totalCount})
              </Button>
            ) : (
              <Button
                onClick={onDeselectAll}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
                title="取消全选"
              >
                取消全选
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onClearSelection}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {clearText}
            </Button>
            {onDelete && (
              <Button
                onClick={onDelete}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleteText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
