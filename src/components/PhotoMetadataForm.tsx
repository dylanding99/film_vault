/**
 * FilmVault Photo Metadata Form
 *
 * 编辑单张照片的拍摄参数
 * 支持 ISO、光圈、快门、焦距、GPS 等编辑
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Camera, MapPin, FileText, MessageSquare, RefreshCw } from 'lucide-react';
import type { Photo } from '@/types/roll';
import type { ExifData } from '@/types/exif';
import { writePhotoExif, readPhotoExif } from '@/lib/db';

interface PhotoMetadataFormProps {
  photo: Photo;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// 常用选项
const ISO_OPTIONS = [100, 200, 400, 800, 1600, 3200];
const APERTURE_OPTIONS = ['f/1.4', 'f/2', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16'];
const SHUTTER_OPTIONS = ['1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1/8'];
const FOCAL_LENGTH_OPTIONS = ['24mm', '35mm', '50mm', '85mm', '100mm', '135mm'];

export function PhotoMetadataForm({
  photo,
  open,
  onClose,
  onUpdate,
}: PhotoMetadataFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReadingExif, setIsReadingExif] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单数据 - EXIF从文件读取，描述/备注从数据库读取
  const [formData, setFormData] = useState<ExifData>({
    iso: undefined,
    aperture: undefined,
    shutter_speed: undefined,
    focal_length: undefined,
    gps_latitude: photo.lat ?? undefined,
    gps_longitude: photo.lon ?? undefined,
    description: photo.exif_description ?? undefined,
    user_comment: photo.exif_user_comment ?? undefined,
  });

  // 从文件读取 EXIF
  const handleReadFromExif = async () => {
    setIsReadingExif(true);
    setError(null);

    try {
      const exifData = await readPhotoExif(photo.id);

      // 更新表单数据
      setFormData({
        iso: exifData.iso,
        aperture: exifData.aperture,
        shutter_speed: exifData.shutter_speed,
        focal_length: exifData.focal_length,
        gps_latitude: exifData.gps_latitude,
        gps_longitude: exifData.gps_longitude,
        description: exifData.description,
        user_comment: exifData.user_comment,
      });
    } catch (err) {
      setError(`读取 EXIF 失败: ${err}`);
    } finally {
      setIsReadingExif(false);
    }
  };

  // 保存 EXIF 到文件
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // 写入 EXIF 到文件
      await writePhotoExif({
        photo_id: photo.id,
        exif_data: formData,
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

  const updateField = <K extends keyof ExifData>(field: K, value: ExifData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Camera className="h-5 w-5" />
            编辑 EXIF - {photo.filename}
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
              {isReadingExif ? '读取中...' : '从文件读取 EXIF'}
            </Button>
          </div>

          {/* 拍摄参数 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              拍摄参数
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* ISO */}
              <div>
                <Label htmlFor="iso" className="text-zinc-400">ISO</Label>
                <select
                  id="iso"
                  value={formData.iso ?? ''}
                  onChange={(e) => updateField('iso', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                >
                  <option value="">未设置</option>
                  {ISO_OPTIONS.map(iso => (
                    <option key={iso} value={iso}>{iso}</option>
                  ))}
                </select>
              </div>

              {/* 光圈 */}
              <div>
                <Label htmlFor="aperture" className="text-zinc-400">光圈</Label>
                <select
                  id="aperture"
                  value={formData.aperture ?? ''}
                  onChange={(e) => updateField('aperture', e.target.value || undefined)}
                  className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                >
                  <option value="">未设置</option>
                  {APERTURE_OPTIONS.map(apt => (
                    <option key={apt} value={apt}>{apt}</option>
                  ))}
                </select>
              </div>

              {/* 快门 */}
              <div>
                <Label htmlFor="shutter" className="text-zinc-400">快门</Label>
                <select
                  id="shutter"
                  value={formData.shutter_speed ?? ''}
                  onChange={(e) => updateField('shutter_speed', e.target.value || undefined)}
                  className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                >
                  <option value="">未设置</option>
                  {SHUTTER_OPTIONS.map(shutter => (
                    <option key={shutter} value={shutter}>{shutter}s</option>
                  ))}
                </select>
              </div>

              {/* 焦距 */}
              <div>
                <Label htmlFor="focalLength" className="text-zinc-400">焦距</Label>
                <select
                  id="focalLength"
                  value={formData.focal_length ?? ''}
                  onChange={(e) => updateField('focal_length', e.target.value || undefined)}
                  className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                >
                  <option value="">未设置</option>
                  {FOCAL_LENGTH_OPTIONS.map(focal => (
                    <option key={focal} value={focal}>{focal}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* GPS 位置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              GPS 位置
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="latitude" className="text-zinc-400">纬度</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.gps_latitude ?? ''}
                  onChange={(e) => updateField('gps_latitude', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="例如: 39.9042"
                  className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-zinc-400">经度</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.gps_longitude ?? ''}
                  onChange={(e) => updateField('gps_longitude', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="例如: 116.4074"
                  className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* 描述和备注 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              描述和备注
            </h3>

            <div>
              <Label htmlFor="description" className="text-zinc-400">描述</Label>
              <Input
                id="description"
                value={formData.description ?? ''}
                onChange={(e) => updateField('description', e.target.value || undefined)}
                placeholder="照片描述"
                className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div>
              <Label htmlFor="comment" className="text-zinc-400 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                备注
              </Label>
              <textarea
                id="comment"
                value={formData.user_comment ?? ''}
                onChange={(e) => updateField('user_comment', e.target.value || undefined)}
                placeholder="添加备注信息..."
                rows={3}
                className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
              />
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
