import { useState } from 'react';
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
import * as DialogPlugin from '@tauri-apps/plugin-dialog';

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
  const [libraryPath, setLibraryPath] = useState(currentLibraryRoot);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setLibraryPath(currentLibraryRoot);
      setError(null);
    }
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
        setLibraryPath(selected);
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
    if (!libraryPath.trim()) {
      setError('Library path cannot be empty');
      return;
    }

    setIsSaving(true);

    try {
      await onSave(libraryPath);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const displayPath = libraryPath || 'Default location (App Data)';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your FilmVault library preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="library-path">Library Path</Label>
            <div className="flex gap-2">
              <Input
                id="library-path"
                value={displayPath}
                readOnly
                className="flex-1"
                placeholder="Default location (App Data)"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFolder}
                disabled={isSaving}
              >
                Browse...
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {libraryPath
                ? 'Photos will be stored in this location'
                : 'Using default app data directory'}
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">Note:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Changing the library path only affects new imports</li>
              <li>Existing rolls will remain in their current locations</li>
              <li>Empty path uses the default app data directory</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
