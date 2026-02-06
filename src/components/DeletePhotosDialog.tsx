'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import type { Photo } from '@/types/roll';

interface DeletePhotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: Photo[];
  onDelete: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeletePhotosDialog({
  open,
  onOpenChange,
  photos,
  onDelete,
  isDeleting = false,
}: DeletePhotosDialogProps) {
  if (photos.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            删除照片
          </DialogTitle>
          <DialogDescription>
            此操作无法撤销。请查看将要删除的内容。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-destructive">
                ⚠️ 确认删除 {photos.length} 张照片？
              </p>
              <div className="text-zinc-400">
                <p><strong>数量：</strong> {photos.length} 张</p>
              </div>
            </div>
          </div>

          {/* Deletion Summary */}
          <div className="text-sm text-zinc-400 space-y-2">
            <p className="font-medium text-zinc-300">此操作将删除：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>数据库记录</li>
              <li>缩略图和预览图</li>
              <li>原始照片文件</li>
            </ul>
            <p className="text-destructive font-medium pt-2">
              此操作无法撤销。
            </p>
          </div>

          {/* Photos List Preview */}
          <div className="max-h-40 overflow-y-auto border border-zinc-800 rounded-md p-2">
            <div className="space-y-1">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="text-xs text-zinc-500 truncate px-2 py-1 hover:bg-zinc-900/50 rounded"
                  title={photo.filename}
                >
                  {photo.filename}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
