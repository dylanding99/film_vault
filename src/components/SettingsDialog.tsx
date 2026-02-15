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
      console.log('[SettingsDialog] Dialog opened, currentLibraryRoot:', currentLibraryRoot);
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
    console.log('[SettingsDialog] handleOpenChange called, newOpen:', newOpen, 'currentLibraryRoot:', currentLibraryRoot);
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
        console.log('[SettingsDialog] Selected folder:', selected);
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

    console.log('[SettingsDialog] Saving library root:', pathToSave);
    setIsSaving(true);

    try {
      await onSave(pathToSave);
      console.log('[SettingsDialog] Library root saved successfully');
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const displayPath = selectedPath.trim();

  // Debug logging
  console.log('[SettingsDialog] Rendering - currentLibraryRoot:', currentLibraryRoot, 'selectedPath:', selectedPath, 'displayPath:', displayPath);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Settings className="h-5 w-5" />
            设置
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            配置 FilmVault 应用偏好设置
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 存储设置 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              存储设置
            </h3>
            <div className="space-y-2">
              <Label htmlFor="library-path" className="text-zinc-400">存储库路径</Label>
              <div className="flex gap-2">
                <Input
                  id="library-path"
                  value={displayPath || '(未设置)'}
                  readOnly
                  className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                  placeholder="点击浏览选择存储位置"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectFolder}
                  disabled={isSaving}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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
                <p className="text-xs text-zinc-500">
                  照片将存储在：{displayPath}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-900 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="text-sm text-zinc-500 bg-zinc-800/50 p-3 rounded-md">
            <p className="font-medium mb-1 text-zinc-400">注意:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>更改存储库路径仅影响新导入</li>
              <li>现有胶卷将保留在当前位置</li>
              <li>空路径使用默认应用数据目录</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
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
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
