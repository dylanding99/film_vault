import { useState, useEffect, useMemo } from 'react';
import { Fragment } from 'react';
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
import { colors, spacing, iconSizes, dialogContentPadding } from '@/styles/design-tokens';
import { CAMERAS } from '@/constants/cameras';
import { FILM_STOCKS } from '@/types/roll';
import { useImageAsset } from '@/hooks/useImageAsset';
import { FilmPreset } from '@/types/film-preset';
import { toast } from '@/components/ui/toast';
import { BASIC_FILM_STOCKS } from '@/types/film-preset';
import type { Roll } from '@/types/roll';
import type { Location } from '@/lib/geocoding';
import { writeRollExif, updateRollLocation, applyRollLocationToPhotos, getFilmPresets, createFilmPreset } from '@/lib/db';
import LocationSearchInput from './LocationSearchInput';
import { FilmPresetGrid } from './FilmPresetGrid';
import { FilmPresetForm } from './FilmPresetForm';
import { Plus, Film, Search, X } from 'lucide-react';

interface EditMetadataFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roll: Roll | null;
  onSave: (roll: Roll) => Promise<void>;
}

const FILM_STOCK_OPTIONS = Object.keys(FILM_STOCKS).filter(stock => stock !== 'Unknown');

/**
 * Compact list item for film presets in the edit form
 */
function PresetListItem({ 
  preset, 
  isSelected, 
  onSelect 
}: { 
  preset: FilmPreset; 
  isSelected: boolean; 
  onSelect: (name: string) => void;
}) {
  const { url: imageUrl } = useImageAsset(preset.image_path);

  return (
    <button
      type="button"
      onClick={() => onSelect(preset.name)}
      className={`flex items-center gap-3 p-2 rounded-lg transition-all group text-left border ${
        isSelected 
          ? 'bg-color-brand/10 border-color-brand/30 shadow-glow-sm' 
          : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/[0.08]'
      }`}
    >
      {/* Mini Visual Indicator */}
      <div className={`w-12 h-12 rounded flex-shrink-0 overflow-hidden border border-white/10 relative ${!imageUrl ? (preset.brand_color || 'bg-elevated') : ''}`}>
        {imageUrl ? (
          <img src={imageUrl} alt={preset.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Film className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {/* Format Badge */}
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-white/10 text-white/70 uppercase tracking-tighter border border-white/5">
            {preset.format}
          </span>
          
          {/* Brand Badge */}
          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter ${
            preset.brand.toLowerCase().includes('kodak') ? 'bg-yellow-500/20 text-yellow-500' :
            preset.brand.toLowerCase().includes('fuji') ? 'bg-emerald-500/20 text-emerald-500' :
            'bg-white/10 text-tertiary'
          }`}>
            {preset.brand}
          </span>
          
          {isSelected && (
            <div className="w-1.5 h-1.5 rounded-full bg-color-brand animate-pulse ml-auto" />
          )}
        </div>
        <div className={`text-xs font-medium truncate transition-colors ${
          isSelected ? 'text-color-brand' : 'text-secondary group-hover:text-primary'
        }`}>
          {preset.name}
        </div>
      </div>
    </button>
  );
}

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
  const [presets, setPresets] = useState<FilmPreset[]>([]);
  const [isPresetFormOpen, setIsPresetFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and Sort Presets
  const filteredPresets = useMemo(() => {
    return [...presets]
      .filter(p => {
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          (p.format || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // 1. Sort by Format (e.g., 135, then 120)
        const formatA = a.format || '';
        const formatB = b.format || '';
        const formatCompare = formatA.localeCompare(formatB, 'zh-CN');
        if (formatCompare !== 0) return formatCompare;

        // 2. Sort by Brand
        const brandA = a.brand || '';
        const brandB = b.brand || '';
        const brandCompare = brandA.localeCompare(brandB, 'zh-CN');
        if (brandCompare !== 0) return brandCompare;

        // 3. Sort by Name
        return (a.name || '').localeCompare(b.name || '', 'zh-CN');
      });
  }, [presets, searchQuery]);

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

  // Load presets when dialog opens
  useEffect(() => {
    if (open) {
      getFilmPresets().then(setPresets).catch(console.error);
    }
  }, [open]);

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
            toast.error(`元数据已保存，但有 ${result.failed_count} 个文件写入 EXIF 失败。\n\n可能原因：文件只读、被其他程序占用、或 ExifTool 未安装。`);
          } else {
            setExifStatus('success');
            console.log(`EXIF write completed: ${result.success_count} files`);
          }
        } catch (error) {
          console.error('EXIF write failed:', error);
          setExifStatus('error');
          toast.error(`元数据已保存到数据库，但写入 EXIF 失败。\n\n错误: ${error}\n\n可能原因：ExifTool 未安装。`);
        }
      }

      // Close dialog after a brief delay to show success status
      setTimeout(() => {
        onOpenChange(false);
        setExifStatus('idle');
      }, autoWriteExif && exifStatus !== 'error' ? 500 : 0);
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(`保存失败: ${error}`);
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
      toast.success(`已将位置应用到 ${count} 张照片`);

      // Also write EXIF to all photos
      if (autoWriteExif) {
        try {
          const result = await writeRollExif({
            roll_id: roll.id,
            auto_write: true,
          });
          if (result.failed_count > 0) {
            toast.warning(`位置已应用到 ${count} 张照片，但有 ${result.failed_count} 个文件写入 EXIF 失败。`);
          }
        } catch (error) {
          console.error('EXIF write failed:', error);
        }
      }
    } catch (error) {
      console.error('Apply location failed:', error);
      toast.error(`应用位置失败: ${error}`);
    } finally {
      setIsApplyingLocation(false);
    }
  };

  if (!roll) return null;

  return (
    <Fragment>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-surface border-white/5 shadow-2xl">
          {/* Custom Header with Brand Accent */}
          <div className="relative px-6 pt-8 pb-6 border-b border-white/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-color-brand/40 via-color-brand to-color-brand/40" />
            <DialogHeader className="p-0">
              <DialogTitle className="text-2xl font-display tracking-tight text-primary">编辑胶卷档案</DialogTitle>
              <DialogDescription className="text-tertiary font-body text-sm">
                修订此卷胶片的元数据，确保每一份记忆都有迹可循。
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-8">
            
            {/* Section 1: Film Stock Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-color-brand rounded-full" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">胶片选择 / Film Stock</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPresetFormOpen(true)}
                  className="h-7 px-3 text-[10px] font-mono uppercase tracking-widest bg-white/5 hover:bg-white/10 text-tertiary hover:text-primary transition-all border border-white/5 rounded-full"
                >
                  <Plus className="w-3 h-3 mr-1.5 opacity-50" />
                  新增预设
                </Button>
              </div>
              
              <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                {presets && presets.length > 0 ? (
                  <div className="flex flex-col h-full">
                    {/* Compact Search Bar */}
                    <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01] relative group">
                      <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary group-focus-within:text-color-brand transition-colors" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索胶片名称、品牌或画幅 (如 135)..."
                        className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 pl-9 pr-8 text-xs font-body text-secondary placeholder:text-tertiary/50 focus:outline-none focus:border-color-brand/30 focus:bg-white/[0.08] transition-all"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-7 top-1/2 -translate-y-1/2 p-1 text-tertiary hover:text-primary transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-3">
                      {filteredPresets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filteredPresets.map((preset) => (
                            <PresetListItem
                              key={preset.id}
                              preset={preset}
                              isSelected={filmStock === preset.name}
                              onSelect={setFilmStock}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 mb-3">
                            <Search className="w-5 h-5 text-tertiary/30" />
                          </div>
                          <p className="text-xs text-tertiary font-body">未能找到与 "{searchQuery}" 相关的胶片</p>
                          <button 
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-[10px] font-mono uppercase tracking-widest text-color-brand hover:underline"
                          >
                            清除搜索重试
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <Select
                      id="edit-film-stock"
                      value={filmStock}
                      onChange={(e) => setFilmStock(e.target.value)}
                      className="bg-black/20 border-white/10"
                    >
                      {FILM_STOCK_OPTIONS.map((stock) => (
                        <option key={stock} value={stock}>{stock}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </section>

            {/* Section 2: Basic Info & Shooting Params (Two Columns) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-color-brand/60 rounded-full" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">拍摄参数 / Parameters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Roll Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-[10px] font-mono uppercase tracking-widest text-tertiary ml-1">胶卷名称</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 bg-white/5 border-white/5 focus:border-color-brand/50 transition-all"
                  />
                </div>

                {/* Shoot Date */}
                <div className="space-y-2">
                  <Label htmlFor="edit-date" className="text-[10px] font-mono uppercase tracking-widest text-tertiary ml-1">拍摄日期</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={shootDate}
                    onChange={(e) => setShootDate(e.target.value)}
                    className="h-10 bg-white/5 border-white/5 focus:border-color-brand/50 transition-all invert-calendar-icon"
                  />
                </div>

                {/* Camera */}
                <div className="space-y-2">
                  <Label htmlFor="edit-camera" className="text-[10px] font-mono uppercase tracking-widest text-tertiary ml-1">使用相机</Label>
                  <Select
                    id="edit-camera"
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    className="h-10 bg-white/5 border-white/5 focus:border-color-brand/50"
                  >
                    {CAMERAS.map((cam) => (
                      <option key={cam} value={cam}>{cam}</option>
                    ))}
                  </Select>
                </div>

                {/* Lens */}
                <div className="space-y-2">
                  <Label htmlFor="edit-lens" className="text-[10px] font-mono uppercase tracking-widest text-tertiary ml-1">搭配镜头</Label>
                  <Input
                    id="edit-lens"
                    value={lens}
                    onChange={(e) => setLens(e.target.value)}
                    placeholder="e.g. 50mm f/1.4"
                    className="h-10 bg-white/5 border-white/5 focus:border-color-brand/50 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Location & Extra */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-color-brand/30 rounded-full" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">地理位置与备注 / Context</h3>
              </div>

              <div className="space-y-5">
                {/* Location */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="edit-location" className="text-[10px] font-mono uppercase tracking-widest text-tertiary">拍摄地点</Label>
                    {location && (
                      <button
                        type="button"
                        onClick={handleApplyToPhotos}
                        disabled={isApplyingLocation || isSaving}
                        className="text-[9px] font-mono uppercase tracking-widest text-color-brand hover:text-color-brand-bright disabled:opacity-50 transition-colors"
                      >
                        {isApplyingLocation ? '应用中...' : '同步至所有照片'}
                      </button>
                    )}
                  </div>
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

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="edit-notes" className="text-[10px] font-mono uppercase tracking-widest text-tertiary ml-1">备注信息</Label>
                  <Input
                    id="edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="记录关于这卷胶片的特别记忆..."
                    className="h-10 bg-white/5 border-white/5 focus:border-color-brand/50 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Section 4: Advanced Options */}
            <section className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-1">
                  <input
                    type="checkbox"
                    checked={autoWriteExif}
                    onChange={(e) => setAutoWriteExif(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-color-brand focus:ring-offset-0 focus:ring-color-brand"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">自动写入 EXIF 到照片文件</span>
                  <p className="text-xs text-tertiary leading-relaxed">
                    勾选后，元数据将永久嵌入到此胶卷的所有原始照片文件中。
                  </p>
                </div>
              </label>

              {/* EXIF Status Indicator */}
              {exifStatus !== 'idle' && (
                <div className={`text-[10px] font-mono uppercase tracking-widest p-3 rounded-lg flex items-center gap-3 ${
                  exifStatus === 'writing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  exifStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    exifStatus === 'writing' ? 'bg-blue-400 animate-pulse' :
                    exifStatus === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                  {exifStatus === 'writing' && '正在同步 EXIF 数据...'}
                  {exifStatus === 'success' && '元数据已成功同步至本地文件'}
                  {exifStatus === 'error' && '写入失败，请检查文件权限或 EXIFTOOL 安装'}
                </div>
              )}
            </section>
          </div>

          {/* Footer with Blur Effect */}
          <div className="px-6 py-6 border-t border-white/5 bg-surface/80 backdrop-blur-md flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="px-6 text-tertiary hover:text-primary hover:bg-white/5"
            >
              放弃更改
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-8 btn-primary relative overflow-hidden group shadow-glow"
            >
              <span className={isSaving ? 'opacity-0' : 'opacity-100'}>
                {isSaving ? '正在保存...' : '确认存档'}
              </span>
              {isSaving && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preset Form Dialog */}
    <FilmPresetForm
      open={isPresetFormOpen}
      onOpenChange={setIsPresetFormOpen}
      onSave={async (data) => {
        // Create new preset
        await createFilmPreset(data as any);
        // Reload presets
        const newPresets = await getFilmPresets();
        setPresets(newPresets);
        // Select the newly created preset
        if (!filmStock || !newPresets.find(p => p.name === filmStock)) {
          setFilmStock(data.name);
        }
      }}
    />
    </Fragment>
  );
}
