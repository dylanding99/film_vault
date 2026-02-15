/**
 * FilmVault Photo Metadata Form
 *
 * 支持备注编辑
 * EXIF UserComment 格式: "Shot on {film_stock} | {city}, {country} | {notes}"
 * - film_stock: 从胶卷获取
 * - location: 照片位置优先，回退到胶卷位置
 * - notes: 用户备注
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { MessageSquare, RefreshCw } from 'lucide-react';
import type { Photo } from '@/types/roll';
import type { ExifData } from '@/types/exif';
import { writePhotoExif, readPhotoExif } from '@/lib/db';

interface PhotoMetadataFormProps {
  photo: Photo;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PhotoMetadataForm({
  photo,
  open,
  onClose,
  onUpdate,
}: PhotoMetadataFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isReadingExif, setIsReadingExif] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单数据 - 只有备注
  const [userComment, setUserComment] = useState<string>('');

  // 初始化备注数据
  useEffect(() => {
    setUserComment(photo.exif_user_comment ?? '');
  }, [photo.id, photo.exif_user_comment]);

  // 从文件读取 EXIF
  const handleReadFromExif = async () => {
    setIsReadingExif(true);
    setError(null);

    try {
      const exifData: ExifData = await readPhotoExif(photo.id);

      // 更新备注
      if (exifData.user_comment) {
        setUserComment(exifData.user_comment);
      }
    } catch (err) {
      setError(`读取 EXIF 失败: ${err}`);
    } finally {
      setIsReadingExif(false);
    }
  };

  // 保存备注到文件
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // 写入 EXIF 到文件（只有 UserComment）
      await writePhotoExif({
        photo_id: photo.id,
        user_comment: userComment || undefined,
      });

      // 刷新数据
      onUpdate();
      onClose();
    } catch (err) {
      setError(`保存失败: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <MessageSquare className="h-5 w-5" />
            编辑备注 - {photo.filename}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 从文件读取按钮 */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReadFromExif}
              disabled={isReadingExif}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isReadingExif ? 'animate-spin' : ''}`} />
              {isReadingExif ? '读取中...' : '从文件读取备注'}
            </Button>
          </div>

          {/* 备注 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment" className="text-zinc-400 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                备注
              </Label>
              <textarea
                id="comment"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="添加备注信息..."
                rows={5}
                className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
              />
              <p className="text-xs text-zinc-500 mt-2">
                备注将被写入照片的 EXIF UserComment 字段
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? '保存中...' : '保存到文件'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
