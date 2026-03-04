'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Copy, FileSymlink, Check, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { colors, spacing, iconSizes, dialogContentPadding } from '@/styles/design-tokens';
import * as DialogPlugin from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { previewImportCount } from '@/lib/db';
import { FilmStripBadge } from './FilmStripBadge';
import { formatDate } from '@/lib/utils';
import type { Roll, AddPhotosOptions } from '@/types/roll';

interface AddPhotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPhotos: (options: AddPhotosOptions) => Promise<void>;
  roll: Roll;
}

export function AddPhotosDialog({ open, onOpenChange, onAddPhotos, roll }: AddPhotosDialogProps) {
  const [sourcePath, setSourcePath] = useState('');
  const [copyMode, setCopyMode] = useState(true); // true = copy, false = move
  const [autoWriteExif, setAutoWriteExif] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [imageCount, setImageCount] = useState<number | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, filename: '' });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSourcePath('');
      setImageCount(null);
      setProgress({ current: 0, total: 0, filename: '' });
    }
  }, [open]);

  // Listen to import progress events
  useEffect(() => {
    const unlistenProgress = listen<{
      current: number;
      total: number;
      filename: string;
      rollId: number;
    }>('import-progress', (event) => {
      setProgress({
        current: event.payload.current,
        total: event.payload.total,
        filename: event.payload.filename,
      });
    });

    const unlistenComplete = listen('import-complete', () => {
      setIsAdding(false);
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenComplete.then((fn) => fn());
    };
  }, []);

  // Handle browse button
  const handleBrowse = async () => {
    try {
      const selected = await DialogPlugin.open({
        directory: true,
        multiple: false,
        title: '选择包含照片的文件夹',
      });

      if (selected && typeof selected === 'string') {
        setSourcePath(selected);
        // Preview image count
        try {
          const count = await previewImportCount(selected);
          setImageCount(count);
        } catch (error) {
          console.error('Failed to preview import count:', error);
          setImageCount(null);
        }
      }
    } catch (error) {
      console.error('Failed to open directory dialog:', error);
    }
  };

  // Handle add photos
  const handleAddPhotos = async () => {
    if (!sourcePath) {
      toast.error('请选择源文件夹');
      return;
    }

    if (imageCount === 0) {
      toast.error('所选文件夹中没有图片');
      return;
    }

    setIsAdding(true);
    try {
      await onAddPhotos({
        roll_id: roll.id,
        source_path: sourcePath,
        copy_mode: copyMode,
        auto_write_exif: autoWriteExif ? true : undefined,
      });
    } catch (error) {
      console.error('Failed to add photos:', error);
      toast.error(`添加照片失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>添加照片到胶卷</DialogTitle>
          <DialogDescription>
            选择要添加的照片文件夹，照片将被导入到现有胶卷中
          </DialogDescription>
        </DialogHeader>

        <div className={`space-y-6 ${dialogContentPadding.MD}`}>
          {/* Roll Info */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{roll.name}</h3>
              <FilmStripBadge filmStock={roll.film_stock} />
            </div>
            <div className="space-y-1 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">相机:</span>
                <span>{roll.camera}</span>
                {roll.lens && <span>· {roll.lens}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">拍摄日期:</span>
                <span>{formatDate(roll.shoot_date)}</span>
              </div>
            </div>
          </div>

          {/* Source Path */}
          <div className="space-y-2">
            <Label htmlFor="source-path" className="text-sm font-medium text-zinc-300">
              源文件夹
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 flex items-center">
                {sourcePath ? (
                  <span className="truncate">{sourcePath}</span>
                ) : (
                  <span className="text-zinc-500">未选择文件夹</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleBrowse}
                disabled={isAdding}
                className="shrink-0"
              >
                <FolderOpen className={iconSizes.MD} />
              </Button>
            </div>
            {imageCount !== null && (
              <div className="flex items-center gap-2 text-sm">
                {imageCount > 0 ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <Check className={iconSizes.MD} />
                    <span>找到 {imageCount} 张照片</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-400">
                    <AlertCircle className={iconSizes.MD} />
                    <span>没有找到照片</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Handling Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-zinc-300">
              文件处理方式
            </Label>
            <RadioGroup
              value={copyMode ? 'copy' : 'move'}
              onValueChange={(value) => setCopyMode(value === 'copy')}
              disabled={isAdding}
            >
              <div className="flex items-center space-x-2 rounded-md border border-zinc-700 p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer">
                <RadioGroupItem value="copy" id="copy" className="border-zinc-600 text-white" />
                <Label htmlFor="copy" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Copy className={`${iconSizes.MD} text-zinc-400`} />
                    <div>
                      <div className="font-medium text-sm">复制文件</div>
                      <div className="text-xs text-zinc-500">保留源文件</div>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-zinc-700 p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer">
                <RadioGroupItem value="move" id="move" className="border-zinc-600 text-white" />
                <Label htmlFor="move" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileSymlink className={`${iconSizes.MD} text-zinc-400`} />
                    <div>
                      <div className="font-medium text-sm">移动文件</div>
                      <div className="text-xs text-zinc-500">删除源文件</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Auto Write EXIF */}
          <div className="flex items-center space-x-3 bg-zinc-800/50 rounded-md p-3 border border-zinc-700/50">
            <Checkbox
              id="auto-exif"
              checked={autoWriteExif}
              onCheckedChange={(checked) => setAutoWriteExif(checked as boolean)}
              disabled={isAdding}
              className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <div className="flex-1">
              <Label htmlFor="auto-exif" className="cursor-pointer">
                <div className="font-medium text-sm">自动写入 EXIF</div>
                <div className="text-xs text-zinc-500">
                  将胶卷的元数据写入照片的 EXIF 信息
                </div>
              </Label>
            </div>
          </div>

          {/* Progress Bar */}
          {isAdding && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>正在处理...</span>
                <span>{progress.current}/{progress.total}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{
                    width: `${(progress.current / Math.max(progress.total, 1)) * 100}%`,
                  }}
                />
              </div>
              {progress.filename && (
                <div className="text-xs text-zinc-500 truncate">
                  {progress.filename}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleAddPhotos}
            disabled={!sourcePath || imageCount === 0 || isAdding}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isAdding ? '添加中...' : '添加照片'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
