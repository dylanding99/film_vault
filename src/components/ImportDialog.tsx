import { useState, useEffect } from 'react';
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
import * as DialogPlugin from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { FILM_STOCKS, ImportOptions } from '@/types/roll';
import { FilmPreset } from '@/types/film-preset';
import { BASIC_FILM_STOCKS } from '@/types/film-preset';
import { previewImportCount, getFilmPresets, createFilmPreset } from '@/lib/db';
import { FilmPresetGrid } from './FilmPresetGrid';
import { FilmPresetForm } from './FilmPresetForm';
import { Plus } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (options: ImportOptions) => Promise<void>;
  libraryRoot: string;
}


export function ImportDialog({ open, onOpenChange, onImport, libraryRoot }: ImportDialogProps) {
  const [sourcePath, setSourcePath] = useState('');
  const [filmStock, setFilmStock] = useState('Kodak Portra 400');
  const [camera, setCamera] = useState('Canon AE-1');
  const [lens, setLens] = useState('');
  const [shootDate, setShootDate] = useState(new Date().toISOString().split('T')[0]);
  const [rollName, setRollName] = useState('');
  const [notes, setNotes] = useState('');
  const [copyMode, setCopyMode] = useState(true); // true = copy, false = move
  const [autoWriteExif, setAutoWriteExif] = useState(true); // Auto write EXIF on import
  const [isImporting, setIsImporting] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [presets, setPresets] = useState<FilmPreset[]>([]);
  const [isPresetFormOpen, setIsPresetFormOpen] = useState(false);

  // Import progress state
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    filename: '',
  });

  // Listen for import progress events
  useEffect(() => {
    const unlistenProgress = listen<{
      current: number;
      total: number;
      filename: string;
      rollId: number;
    }>('import-progress', (event) => {
      setImportProgress({
        current: event.payload.current,
        total: event.payload.total,
        filename: event.payload.filename,
      });
    });

    return () => {
      unlistenProgress.then((fn) => fn());
    };
  }, []);

  // Load presets when dialog opens
  useEffect(() => {
    if (open) {
      getFilmPresets().then(setPresets).catch(console.error);
    }
  }, [open]);

  const handleSelectFolder = async () => {
    try {
      const selected = await DialogPlugin.open({
        directory: true,
        multiple: false,
        title: 'Select folder with photos',
      });

      if (selected && typeof selected === 'string') {
        setSourcePath(selected);

        // Check if folder contains images
        try {
          const count = await previewImportCount(selected);
          if (count === 0) {
            toast.error('选择的文件夹中没有找到图片文件（支持的格式：jpg, jpeg, png, webp, tif, tiff, bmp）');
            setSourcePath('');
            return;
          }
          console.log(`[ImportDialog] Found ${count} images in folder`);
        } catch (error) {
          console.error('Failed to preview folder:', error);
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleImport = async () => {
    if (!sourcePath) {
      toast.error('请选择源文件夹');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: 0, filename: '' });

    try {
      await onImport({
        source_path: sourcePath,
        film_stock: filmStock,
        camera: camera,
        lens: lens || undefined,
        shoot_date: shootDate,
        library_root: libraryRoot,
        roll_name: rollName || undefined,
        notes: notes || undefined,
        copy_mode: copyMode,
        auto_write_exif: autoWriteExif, // Pass auto_write_exif option
      });

      // Reset form (dialog will be closed by parent component)
      setSourcePath('');
      setLens('');
      setRollName('');
      setNotes('');
      setShootDate(new Date().toISOString().split('T')[0]);
      setCopyMode(true);
      setAutoWriteExif(true);
      setImportProgress({ current: 0, total: 0, filename: '' });
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`导入失败: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Fragment>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>导入胶卷</DialogTitle>
          <DialogDescription>
            选择一个包含照片的文件夹来导入新的胶卷
          </DialogDescription>
        </DialogHeader>

        <div className={`grid ${spacing.gap.LG} ${dialogContentPadding.MD}`}>
          {/* Source Path */}
          <div className="grid gap-2">
            <Label htmlFor="source">源文件夹</Label>
            <div className="flex gap-2">
              <Input
                id="source"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="选择包含照片的文件夹..."
                className="flex-1"
                readOnly
              />
              <Button onClick={handleSelectFolder} type="button" variant="outline">
                浏览
              </Button>
            </div>
          </div>

          {/* Film Stock */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="film-stock">胶片类型</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPresetFormOpen(true)}
                className="text-zinc-400 hover:text-white gap-1 h-6 px-2"
              >
                <Plus className={iconSizes.XS} />
                添加新预设
              </Button>
            </div>
            {presets && presets.length > 0 ? (
              <div className="max-h-48 overflow-y-auto">
                <FilmPresetGrid
                  presets={presets}
                  selectedPresetName={filmStock}
                  onSelect={(preset) => setFilmStock(preset.name)}
                  selectable
                />
              </div>
            ) : (
              <Select
                id="film-stock"
                value={filmStock}
                onChange={(e) => setFilmStock(e.target.value)}
              >
                {BASIC_FILM_STOCKS.map((stock) => (
                  <option key={stock} value={stock}>
                    {stock}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Camera */}
          <div className="grid gap-2">
            <Label htmlFor="camera">相机</Label>
            <Select
              id="camera"
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
            <Label htmlFor="lens">镜头 (可选)</Label>
            <Input
              id="lens"
              value={lens}
              onChange={(e) => setLens(e.target.value)}
              placeholder="例如: 50mm f/1.4"
            />
          </div>

          {/* Shoot Date */}
          <div className="grid gap-2">
            <Label htmlFor="date">拍摄日期</Label>
            <Input
              id="date"
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
            />
          </div>

          {/* Roll Name */}
          <div className="grid gap-2">
            <Label htmlFor="roll-name">胶卷名称 (可选)</Label>
            <Input
              id="roll-name"
              value={rollName}
              onChange={(e) => setRollName(e.target.value)}
              placeholder="留空则自动生成"
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">备注 (可选)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="任何附加备注..."
            />
          </div>

          {/* File Copy Mode */}
          <div className="grid gap-2">
            <Label>文件处理方式</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="copyMode"
                  checked={copyMode}
                  onChange={() => setCopyMode(true)}
                  className="w-4 h-4"
                />
                <span className="text-sm">复制（保留源文件）</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="copyMode"
                  checked={!copyMode}
                  onChange={() => setCopyMode(false)}
                  className="w-4 h-4"
                />
                <span className="text-sm">移动（删除源文件）</span>
              </label>
            </div>
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
              <span className="text-sm">导入时自动写入 EXIF</span>
            </label>
            <p className="text-xs text-zinc-500 ml-6">
              建议勾选，元数据将永久嵌入照片文件（相机、镜头、胶片类型、拍摄日期等）
            </p>
          </div>

          {/* Import Progress */}
          {isImporting && importProgress.total > 0 && (
            <div className="grid gap-2 p-4 bg-zinc-800 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">导入进度</span>
                <span className="text-zinc-300">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className={`${colors.primary.DEFAULT} h-2 rounded-full transition-all`}
                  style={{
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                  }}
                />
              </div>
              {importProgress.filename && (
                <div className="text-xs text-zinc-500 truncate">
                  正在处理: {importProgress.filename}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !sourcePath}>
            {isImporting ? '导入中...' : '导入胶卷'}
          </Button>
        </DialogFooter>
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
