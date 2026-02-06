'use client';

import { useState } from 'react';
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
import type { Roll } from '@/types/roll';

interface DeleteRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roll?: Roll | null;
  photoCount?: number;
  deleteCount?: number;
  onDelete: (deleteFiles: boolean, deleteOriginals: boolean) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteRollDialog({
  open,
  onOpenChange,
  roll,
  photoCount = 0,
  deleteCount,
  onDelete,
  isDeleting = false,
}: DeleteRollDialogProps) {
  const [deleteFiles, setDeleteFiles] = useState(true);
  const [deleteOriginals, setDeleteOriginals] = useState(true);

  const isBatchDelete = deleteCount !== undefined;
  const itemCount = isBatchDelete ? deleteCount : 1;
  const displayRoll = isBatchDelete ? null : roll;

  if (isBatchDelete && deleteCount === 0) return null;
  if (!isBatchDelete && !roll) return null;

  const handleDelete = async () => {
    await onDelete(deleteFiles, deleteOriginals);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            删除胶卷
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
                {isBatchDelete
                  ? `您即将删除 ${deleteCount} 个胶卷`
                  : '您即将删除一个胶卷'
                }
              </p>
              <div className="text-zinc-400 space-y-1">
                {isBatchDelete ? (
                  <p><strong>数量：</strong> {deleteCount} 个胶卷</p>
                ) : (
                  <>
                    <p><strong>胶卷：</strong> {roll?.name}</p>
                    <p><strong>照片：</strong> {photoCount}</p>
                    <p><strong>位置：</strong> {roll?.path}</p>
                  </>
                )}
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
                  删除生成的文件（缩略图和预览图）
                </Label>
                <p className="text-sm text-zinc-500 mt-1">
                  始终删除 thumbnails/ 和 previews/ 子目录
                </p>
              </div>
            </div>

            {/* Delete Originals Checkbox */}
            <div className={`flex items-start gap-3 p-3 border rounded-md ${
              deleteFiles
                ? 'border-zinc-800'
                : 'border-zinc-900 bg-zinc-950/50 opacity-50'
            }`}>
              <input
                type="checkbox"
                id="delete-originals"
                checked={deleteOriginals}
                onChange={(e) => setDeleteOriginals(e.target.checked)}
                disabled={!deleteFiles || isDeleting}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-800"
              />
              <div className="flex-1">
                <Label htmlFor="delete-originals" className={`font-medium ${
                  !deleteFiles ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}>
                  同时删除原始照片文件
                </Label>
                <p className="text-sm text-zinc-500 mt-1">
                  永久删除磁盘上的所有原始照片
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm space-y-1">
              <p className="text-zinc-400">
                <strong className="text-zinc-300">数据库记录</strong> 将始终被删除
              </p>
              {deleteFiles && deleteOriginals && (
                <p className="text-destructive">
                  所有文件（原始文件、缩略图、预览图）将被永久删除
                </p>
              )}
              {deleteFiles && !deleteOriginals && (
                <p className="text-zinc-400">
                  仅删除缩略图和预览图，原始文件将保留。
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
            {isDeleting ? '删除中...' : '删除胶卷'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
