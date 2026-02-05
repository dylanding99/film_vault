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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (roll) {
      setName(roll.name);
      setFilmStock(roll.film_stock);
      setCamera(roll.camera);
      setLens(roll.lens || '');
      setShootDate(roll.shoot_date.split('T')[0]);
      setNotes(roll.notes || '');
    }
  }, [roll]);

  const handleSave = async () => {
    if (!roll) return;

    setIsSaving(true);

    try {
      await onSave({
        ...roll,
        name,
        film_stock: filmStock,
        camera,
        lens: lens || undefined,
        shoot_date: shootDate,
        notes: notes || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Failed to save: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!roll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Roll Metadata</DialogTitle>
          <DialogDescription>
            Update the metadata for this film roll.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Roll Name */}
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Roll Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Film Stock */}
          <div className="grid gap-2">
            <Label htmlFor="edit-film-stock">Film Stock</Label>
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
            <Label htmlFor="edit-camera">Camera</Label>
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
            <Label htmlFor="edit-lens">Lens</Label>
            <Input
              id="edit-lens"
              value={lens}
              onChange={(e) => setLens(e.target.value)}
              placeholder="e.g., 50mm f/1.4"
            />
          </div>

          {/* Shoot Date */}
          <div className="grid gap-2">
            <Label htmlFor="edit-date">Shoot Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
