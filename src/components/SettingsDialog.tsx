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
import { Settings, HardDrive, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { colors, iconSizes } from '@/styles/design-tokens';
import * as DialogPlugin from '@tauri-apps/plugin-dialog';
import { checkExifToolAvailable } from '@/lib/db';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLibraryRoot: string;
  onSave: (path: string) => Promise<void>;
}

export function SettingsDialog({
  open,
  onOpenChange,
  currentLibraryRoot,
  onSave,
}: SettingsDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exifToolStatus, setExifToolStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [selectedPath, setSelectedPath] = useState<string>(currentLibraryRoot);

  // Check ExifTool availability when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPath(currentLibraryRoot);
      checkExifTool();
    }
  }, [open, currentLibraryRoot]);

  const checkExifTool = async () => {
    setExifToolStatus('checking');
    try {
      const available = await checkExifToolAvailable();
      setExifToolStatus(available ? 'available' : 'unavailable');
    } catch {
      setExifToolStatus('unavailable');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await DialogPlugin.open({
        directory: true,
        multiple: false,
        title: 'Select library root folder',
      });

      if (selected && typeof selected === 'string') {
        setSelectedPath(selected);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
      setError('Failed to select folder');
    }
  };

  const handleSave = async () => {
    setError(null);

    // Basic validation
    const pathToSave = selectedPath.trim();
    if (!pathToSave) {
      setError('Library path cannot be empty');
      return;
    }

    setIsSaving(true);

    try {
      await onSave(pathToSave);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const displayPath = selectedPath.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg flex flex-col p-0 overflow-hidden bg-surface border-white/5 shadow-2xl">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 border-b border-white/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-color-brand/40 via-color-brand to-color-brand/40" />
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-display tracking-tight text-primary">
              <Settings className={iconSizes.LG} />
              设置
            </DialogTitle>
            <DialogDescription className="text-tertiary text-sm">
              配置 FilmVault 应用偏好设置
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* 存储设置 */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
              <HardDrive className={iconSizes.MD} />
              存储设置
            </h3>
            <div className="space-y-2">
              <Label htmlFor="library-path" className="text-secondary">存储库路径</Label>
              <div className="flex gap-2">
                <Input
                  id="library-path"
                  value={displayPath || '(未设置)'}
                  readOnly
                  className="flex-1 bg-white/5 border-white/10 text-primary"
                  placeholder="点击浏览选择存储位置"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectFolder}
                  disabled={isSaving}
                  className="border-white/10 text-secondary hover:bg-white/5"
                >
                  浏览...
                </Button>
              </div>
              {!displayPath && (
                <p className="text-xs text-amber-500">
                  ⚠️ 未设置存储路径，照片将保存在默认应用数据目录
                </p>
              )}
              {displayPath && (
                <p className="text-xs text-tertiary">
                  照片将存储在：{displayPath}
                </p>
              )}
            </div>
          </div>

          {/* ExifTool 状态 */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">ExifTool 状态</h3>
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-md px-3 py-2">
              {exifToolStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-tertiary" />}
              {exifToolStatus === 'available' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {exifToolStatus === 'unavailable' && <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-secondary text-xs">
                ExifTool: {exifToolStatus === 'checking' ? '检测中...' : exifToolStatus === 'available' ? '已安装' : '未安装'}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/30 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="text-sm text-tertiary bg-white/5 border border-white/5 p-3 rounded-md">
            <p className="font-medium mb-1 text-secondary">注意:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>更改存储库路径仅影响新导入</li>
              <li>现有胶卷将保留在当前位置</li>
              <li>空路径使用默认应用数据目录</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-white/5">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
            className="border-white/10 text-secondary hover:bg-white/5"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`${colors.primary.DEFAULT} ${colors.primary.hover}`}
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
