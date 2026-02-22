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
import { FilmPreset, PresetFormData, FILM_FORMATS, BRAND_COLORS } from '@/types/film-preset';
import { uploadPresetImage } from '@/lib/db';
import { Upload, X } from 'lucide-react';
import * as DialogPlugin from '@tauri-apps/plugin-dialog';

interface FilmPresetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PresetFormData) => Promise<void>;
  preset?: FilmPreset; // If provided, edit mode
}

export function FilmPresetForm({ open, onOpenChange, onSave, preset }: FilmPresetFormProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [format, setFormat] = useState('135');
  const [brandColor, setBrandColor] = useState('bg-purple-600');
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when dialog opens/closes or preset changes
  useEffect(() => {
    if (open) {
      if (preset) {
        // Edit mode: populate with existing data
        setName(preset.name);
        setBrand(preset.brand);
        setFormat(preset.format);
        setBrandColor(preset.brand_color);
        setImageFile(undefined);
        setImagePreview(null);
      } else {
        // Create mode: reset to defaults
        setName('');
        setBrand('');
        setFormat('135');
        setBrandColor('bg-purple-600');
        setImageFile(undefined);
        setImagePreview(null);
      }
    }
  }, [open, preset]);

  // Auto-detect brand from name when name changes
  useEffect(() => {
    if (!preset && name && !brand) {
      const commonBrands = ['Kodak', 'Fujifilm', 'Ilford', 'CineStill', 'Lomography', 'Foma', 'Agfa', 'Kentmere', 'Rollei', 'Harman'];
      for (const b of commonBrands) {
        if (name.toLowerCase().startsWith(b.toLowerCase())) {
          setBrand(b);
          break;
        }
      }
    }
  }, [name, brand, preset]);

  // Auto-set brand color when brand changes
  useEffect(() => {
    if (!preset && brand) {
      const brandColorMap: Record<string, string> = {
        'kodak': 'bg-yellow-500',
        'fujifilm': 'bg-green-500',
        'fuji': 'bg-green-500',
        'ilford': 'bg-neutral-500',
        'cinestill': 'bg-red-500',
        'foma': 'bg-blue-500',
        'lomography': 'bg-purple-500',
        'agfa': 'bg-orange-500',
        'kentmere': 'bg-zinc-500',
        'rollei': 'bg-slate-500',
        'harman': 'bg-gray-500',
      };
      const key = brand.toLowerCase();
      if (brandColorMap[key]) {
        setBrandColor(brandColorMap[key]);
      }
    }
  }, [brand, preset]);

  const handleFileSelect = async () => {
    try {
      const selected = await DialogPlugin.open({
        multiple: false,
        title: '选择预设图片',
      });

      if (selected && typeof selected === 'string') {
        // In Tauri, we get file path
        // For preview, we'll need to read the file differently
        // For now, just store the path
        setImageFile({
          name: selected.split(/[/\\]/).pop() || 'image.jpg',
          path: selected,
        } as unknown as File);

        // Try to read as base64 for preview
        try {
          const { readImageAsBase64 } = await import('@/lib/db');
          const data = await readImageAsBase64(selected);
          setImagePreview(data);
        } catch (error) {
          console.error('Failed to preview image:', error);
        }
      }
    } catch (error) {
      console.error('Failed to select file:', error);
    }
  };

  const clearImage = () => {
    setImageFile(undefined);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('请输入胶片名称');
      return;
    }

    if (!brand.trim()) {
      alert('请输入品牌');
      return;
    }

    setIsSaving(true);

    try {
      // Upload image if provided
      let imagePath: string | undefined;
      if (imageFile && (imageFile as any).path) {
        setIsUploading(true);
        try {
          imagePath = await uploadPresetImage((imageFile as any).path);
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('图片上传失败，将保存为纯色背景');
        }
        setIsUploading(false);
      }

      // Use existing image path if editing and no new image provided
      if (!imagePath && preset?.image_path) {
        imagePath = preset.image_path;
      }

      await onSave({
        name: name.trim(),
        format: format,
        brand_color: brandColor,
        brand: brand.trim(),
        image_path: imagePath,
      });

      // Reset form
      if (!preset) {
        setName('');
        setBrand('');
        setFormat('135');
        setBrandColor('bg-purple-600');
        setImageFile(undefined);
        setImagePreview(null);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert(`保存失败: ${error}`);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{preset ? '编辑胶片预设' : '添加胶片预设'}</DialogTitle>
          <DialogDescription>
            创建或编辑胶片类型预设，用于快速选择常用的胶片
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Brand */}
          <div className="grid gap-2">
            <Label htmlFor="preset-brand">品牌</Label>
            <Input
              id="preset-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="例如: Kodak"
            />
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="preset-name">胶片完整名称</Label>
            <Input
              id="preset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: Portra 400"
            />
          </div>

          {/* Format */}
          <div className="grid gap-2">
            <Label htmlFor="preset-format">画幅类型</Label>
            <Select
              id="preset-format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {FILM_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Brand Color */}
          <div className="grid gap-2">
            <Label>品牌颜色</Label>
            <div className="grid grid-cols-5 gap-2">
              {BRAND_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setBrandColor(color.value)}
                  className={`h-10 rounded-lg transition-all ${
                    brandColor === color.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
                      : ''
                  }`}
                  style={{ backgroundColor: color.preview }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="grid gap-2">
            <Label>预设图片（可选）</Label>
            {imagePreview ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleFileSelect}
                className="w-32 h-32 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors"
              >
                <Upload className="h-8 w-8 text-zinc-500 mb-2" />
                <span className="text-xs text-zinc-500">点击上传</span>
              </div>
            )}
            <p className="text-xs text-zinc-500">
              推荐 1:1 正方形图片，将自动裁剪并转换为 WebP 格式
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSaving || isUploading}>
            {isUploading ? '上传中...' : isSaving ? '保存中...' : preset ? '更新' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
