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
import { Select } from './ui/select';
import * as DialogPlugin from '@tauri-apps/plugin-dialog';
import { FILM_STOCKS } from '@/types/roll';
import { ImportOptions } from '@/types/roll';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (options: ImportOptions) => Promise<void>;
  libraryRoot: string;
}

const FILM_STOCK_OPTIONS = Object.keys(FILM_STOCKS).filter(stock => stock !== 'Unknown');

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

export function ImportDialog({ open, onOpenChange, onImport, libraryRoot }: ImportDialogProps) {
  const [sourcePath, setSourcePath] = useState('');
  const [filmStock, setFilmStock] = useState('Kodak Portra 400');
  const [camera, setCamera] = useState('Canon AE-1');
  const [lens, setLens] = useState('');
  const [shootDate, setShootDate] = useState(new Date().toISOString().split('T')[0]);
  const [rollName, setRollName] = useState('');
  const [notes, setNotes] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const handleSelectFolder = async () => {
    try {
      const selected = await DialogPlugin.open({
        directory: true,
        multiple: false,
        title: 'Select folder with photos',
      });

      if (selected && typeof selected === 'string') {
        setSourcePath(selected);
        // Optionally, preview the count
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleImport = async () => {
    if (!sourcePath) {
      alert('Please select a source folder');
      return;
    }

    setIsImporting(true);

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
      });

      // Reset form
      setSourcePath('');
      setLens('');
      setRollName('');
      setNotes('');
      setShootDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Film Roll</DialogTitle>
          <DialogDescription>
            Select a folder of photos to import as a new film roll.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Source Path */}
          <div className="grid gap-2">
            <Label htmlFor="source">Source Folder</Label>
            <div className="flex gap-2">
              <Input
                id="source"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="Select folder containing photos..."
                className="flex-1"
                readOnly
              />
              <Button onClick={handleSelectFolder} type="button" variant="outline">
                Browse
              </Button>
            </div>
          </div>

          {/* Film Stock */}
          <div className="grid gap-2">
            <Label htmlFor="film-stock">Film Stock</Label>
            <Select
              id="film-stock"
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
            <Label htmlFor="camera">Camera</Label>
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
            <Label htmlFor="lens">Lens (Optional)</Label>
            <Input
              id="lens"
              value={lens}
              onChange={(e) => setLens(e.target.value)}
              placeholder="e.g., 50mm f/1.4"
            />
          </div>

          {/* Shoot Date */}
          <div className="grid gap-2">
            <Label htmlFor="date">Shoot Date</Label>
            <Input
              id="date"
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
            />
          </div>

          {/* Roll Name */}
          <div className="grid gap-2">
            <Label htmlFor="roll-name">Roll Name (Optional)</Label>
            <Input
              id="roll-name"
              value={rollName}
              onChange={(e) => setRollName(e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !sourcePath}>
            {isImporting ? 'Importing...' : 'Import Roll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
