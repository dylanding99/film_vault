'use client';

import { useState, useEffect } from 'react';
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
import { Label } from './ui/label';
import type { Photo } from '@/types/roll';

interface DeletePhotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: Photo[];
  onDelete: (deleteFiles: boolean) => Promise<void>;
  isDeleting?: boolean;
}

export function DeletePhotosDialog({
  open,
  onOpenChange,
  photos,
  onDelete,
  isDeleting = false,
}: DeletePhotosDialogProps) {
  const [deleteFiles, setDeleteFiles] = useState(true);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setDeleteFiles(true);
    }
  }, [open]);

  if (photos.length === 0) return null;

  const handleDelete = async () => {
    await onDelete(deleteFiles);
  };

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
                您即将删除 {photos.length} 张照片
              </p>
              <div className="text-zinc-400 space-y-1">
                <p><strong>数量：</strong> {photos.length} 张</p>
              </div>
            </div>
          </div>

          {/* File Deletion Options */}
          <div className="space-y-3">
            <Label className="text-base">文件删除选项</Label>

            {/* Delete Files Checkbox */}
            <div className="flex items-start gap-3 p-3 border border-zinc-800 rounded-md">
              <input
                type="checkbox"
                id="delete-files"
                checked={deleteFiles}
                onChange={(e) => setDeleteFiles(e.target.checked)}
                disabled={isDeleting}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-800"
              />
              <div className="flex-1">
                <Label htmlFor="delete-files" className="cursor-pointer font-medium">
                  同时删除缩略图和预览图
                </Label>
                <p className="text-sm text-zinc-500 mt-1">
                  删除生成的缩略图和预览图文件（原始照片文件不会被删除）
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm space-y-1">
              <p className="text-zinc-400">
                <strong className="text-zinc-300">数据库记录</strong> 将始终被删除
              </p>
              {deleteFiles && (
                <p className="text-zinc-400">
                  缩略图和预览图文件将被删除，原始照片文件将保留。
                </p>
              )}
              {!deleteFiles && (
                <p className="text-zinc-400">
                  所有物理文件将保留在磁盘上。仅删除数据库记录。
                </p>
              )}
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
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? '删除中...' : '删除照片'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
