import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { FILM_STOCKS } from '@/types/roll';
import type { Roll } from '@/types/roll';
import type { Location } from '@/lib/geocoding';
import { writeRollExif, updateRollLocation, applyRollLocationToPhotos } from '@/lib/db';
import LocationSearchInput from './LocationSearchInput';

interface EditMetadataFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roll: Roll | null;
  onSave: (roll: Roll) => Promise<void>;
}

const CAMERAS = [
  'Canon AE-1',
  'Canon A-1',
  'Canon EOS 5',
  'Nikon FM2',
  'Nikon F3',
  'Nikon FE2',
  'Olympus OM-1',
  'Olympus OM-2',
  'Pentax K1000',
  'Pentax MX',
  'Minolta X-700',
  'Minolta X-570',
  'Leica M6',
  'Leica M3',
  'Contax T2',
  'Contax T3',
  'Yashica T4',
  'Ricoh GR1',
  'Fujifilm Klasse W',
  'Fujifilm GA645',
  'Mamiya 645',
  'Mamiya 7',
  'Hasselblad 500C/M',
  'Other',
];

const FILM_STOCK_OPTIONS = Object.keys(FILM_STOCKS).filter(stock => stock !== 'Unknown');

export function EditMetadataForm({ open, onOpenChange, roll, onSave }: EditMetadataFormProps) {
  const [name, setName] = useState('');
  const [filmStock, setFilmStock] = useState('Kodak Portra 400');
  const [camera, setCamera] = useState('Canon AE-1');
  const [lens, setLens] = useState('');
  const [shootDate, setShootDate] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [autoWriteExif, setAutoWriteExif] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingLocation, setIsApplyingLocation] = useState(false);
  const [exifStatus, setExifStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (roll) {
      setName(roll.name);
      setFilmStock(roll.film_stock);
      setCamera(roll.camera);
      setLens(roll.lens || '');
      setShootDate(roll.shoot_date.split('T')[0]);
      setNotes(roll.notes || '');
      setExifStatus('idle');

      // Set location if exists
      if (roll.city && roll.country) {
        setLocation({
          lat: roll.lat,
          lon: roll.lon,
          city: roll.city,
          country: roll.country,
          displayName: `${roll.city}, ${roll.country}`,
        });
      } else {
        setLocation(null);
      }
    }
  }, [roll]);

  const handleSave = async () => {
    if (!roll) return;

    setIsSaving(true);

    try {
      // Save to database first
      await onSave({
        ...roll,
        name,
        film_stock: filmStock,
        camera,
        lens: lens || undefined,
        shoot_date: shootDate,
        notes: notes || undefined,
        city: location?.city,
        country: location?.country,
        lat: location?.lat,
        lon: location?.lon,
      });

      // Write EXIF if enabled
      if (autoWriteExif) {
        setExifStatus('writing');
        try {
          const result = await writeRollExif({
            roll_id: roll.id,
            auto_write: true,
          });

          if (result.failed_count > 0) {
            console.warn(`EXIF write completed with ${result.failed_count} failures:`, result.failed_files);
            setExifStatus('error');
            alert(`元数据已保存，但有 ${result.failed_count} 个文件写入 EXIF 失败。\n\n可能原因：文件只读、被其他程序占用、或 ExifTool 未安装。`);
          } else {
            setExifStatus('success');
            console.log(`EXIF write completed: ${result.success_count} files`);
          }
        } catch (error) {
          console.error('EXIF write failed:', error);
          setExifStatus('error');
          alert(`元数据已保存到数据库，但写入 EXIF 失败。\n\n错误: ${error}\n\n可能原因：ExifTool 未安装。`);
        }
      }

      // Close dialog after a brief delay to show success status
      setTimeout(() => {
        onOpenChange(false);
        setExifStatus('idle');
      }, autoWriteExif && exifStatus !== 'error' ? 500 : 0);
    } catch (error) {
      console.error('Save failed:', error);
      alert(`保存失败: ${error}`);
      setExifStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToPhotos = async () => {
    if (!roll || !location) return;

    setIsApplyingLocation(true);
    try {
      // Apply location to photos using current state values
      const count = await applyRollLocationToPhotos(
        roll.id,
        location.lat,
        location.lon,
        location.city,
        location.country,
      );
      alert(`已将位置应用到 ${count} 张照片`);

      // Also write EXIF to all photos
      if (autoWriteExif) {
        try {
          const result = await writeRollExif({
            roll_id: roll.id,
            auto_write: true,
          });
          if (result.failed_count > 0) {
            alert(`位置已应用到 ${count} 张照片，但有 ${result.failed_count} 个文件写入 EXIF 失败。`);
          }
        } catch (error) {
          console.error('EXIF write failed:', error);
        }
      }
    } catch (error) {
      console.error('Apply location failed:', error);
      alert(`应用位置失败: ${error}`);
    } finally {
      setIsApplyingLocation(false);
    }
  };

  if (!roll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑胶卷元数据</DialogTitle>
          <DialogDescription>
            更新此胶卷的元数据信息
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Roll Name */}
          <div className="grid gap-2">
            <Label htmlFor="edit-name">胶卷名称</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Film Stock */}
          <div className="grid gap-2">
            <Label htmlFor="edit-film-stock">胶片类型</Label>
            <Select
              id="edit-film-stock"
              value={filmStock}
              onChange={(e) => setFilmStock(e.target.value)}
            >
              {FILM_STOCK_OPTIONS.map((stock) => (
                <option key={stock} value={stock}>
                  {stock}
                </option>
              ))}
            </Select>
          </div>

          {/* Camera */}
          <div className="grid gap-2">
            <Label htmlFor="edit-camera">相机</Label>
            <Select
              id="edit-camera"
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
            >
              {CAMERAS.map((cam) => (
                <option key={cam} value={cam}>
                  {cam}
                </option>
              ))}
            </Select>
          </div>

          {/* Lens */}
          <div className="grid gap-2">
            <Label htmlFor="edit-lens">镜头</Label>
            <Input
              id="edit-lens"
              value={lens}
              onChange={(e) => setLens(e.target.value)}
              placeholder="例如: 50mm f/1.4"
            />
          </div>

          {/* Shoot Date */}
          <div className="grid gap-2">
            <Label htmlFor="edit-date">拍摄日期</Label>
            <Input
              id="edit-date"
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <Label htmlFor="edit-location">拍摄地点</Label>
            <LocationSearchInput
              city={location?.city}
              country={location?.country}
              lat={location?.lat}
              lon={location?.lon}
              onSelect={setLocation}
              placeholder="搜索城市..."
              disabled={isSaving}
            />
          </div>

          {/* Apply to Photos Button */}
          {location && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyToPhotos}
                disabled={isApplyingLocation || isSaving}
              >
                {isApplyingLocation ? '应用中...' : '应用到所有照片'}
              </Button>
              <p className="text-xs text-zinc-500">
                将胶卷位置信息应用到没有单独设置位置的照片
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="edit-notes">备注</Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="任何附加备注..."
            />
          </div>

          {/* Auto Write EXIF */}
          <div className="grid gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoWriteExif}
                onChange={(e) => setAutoWriteExif(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">自动写入 EXIF 到照片文件</span>
            </label>
            <p className="text-xs text-zinc-500 ml-6">
              勾选后，元数据将永久嵌入到此胶卷的所有照片文件中
            </p>
          </div>

          {/* EXIF Status */}
          {exifStatus !== 'idle' && (
            <div className={`text-xs p-2 rounded ${
              exifStatus === 'writing' ? 'bg-blue-900/50 text-blue-300' :
              exifStatus === 'success' ? 'bg-green-900/50 text-green-300' :
              'bg-red-900/50 text-red-300'
            }`}>
              {exifStatus === 'writing' && '正在写入 EXIF...'}
              {exifStatus === 'success' && '✓ EXIF 写入成功'}
              {exifStatus === 'error' && '⚠ EXIF 写入失败（见上方提示）'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存更改'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
