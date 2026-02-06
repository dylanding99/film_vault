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
import type { Roll } from '@/types/roll';

interface DeleteRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roll?: Roll | null;
  photoCount?: number;
  deleteCount?: number;
  onDelete: () => Promise<void>;
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
  const isBatchDelete = deleteCount !== undefined;
  const itemCount = isBatchDelete ? deleteCount : 1;

  if (isBatchDelete && deleteCount === 0) return null;
  if (!isBatchDelete && !roll) return null;

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
                ⚠️ 确认删除 {isBatchDelete ? `${deleteCount} 个胶卷？` : '此胶卷？'}
              </p>
              <div className="text-zinc-400 space-y-1">
                {isBatchDelete ? (
                  <p><strong>数量：</strong> {deleteCount} 个胶卷</p>
                ) : (
                  <>
                    <p><strong>胶卷：</strong> {roll?.name}</p>
                    <p><strong>照片：</strong> {photoCount} 张</p>
                    <p><strong>位置：</strong> {roll?.path}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Deletion Summary */}
          <div className="text-sm text-zinc-400 space-y-2">
            <p className="font-medium text-zinc-300">此操作将删除：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>数据库记录</li>
              <li>所有照片文件（缩略图、预览图、原图）</li>
              <li>整个胶卷文件夹</li>
            </ul>
            <p className="text-destructive font-medium pt-2">
              此操作无法撤销。
            </p>
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
