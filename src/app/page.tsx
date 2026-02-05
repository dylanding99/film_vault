'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { RollCard } from '@/components/RollCard';
import { ImportDialog } from '@/components/ImportDialog';
import { EditMetadataForm } from '@/components/EditMetadataForm';
import { Button } from '@/components/ui/button';
import { getAllRolls, importFolder, updateRoll, getPhotosByRoll } from '@/lib/db';
import type { Roll, Photo, ImportOptions, UpdateRollRequest } from '@/types/roll';
import { appDataDir } from '@tauri-apps/api/path';

export default function HomePage() {
  const queryClient = useQueryClient();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<Roll | null>(null);
  const [libraryRoot, setLibraryRoot] = useState<string>('');

  // Get library root path
  useEffect(() => {
    appDataDir().then(dir => {
      // Use app data dir as default library root
      setLibraryRoot(dir);
    });
  }, []);

  // Fetch all rolls
  const { data: rolls = [], isLoading } = useQuery({
    queryKey: ['rolls'],
    queryFn: getAllRolls,
  });

  // Fetch photos for each roll to get cover images
  const { data: rollsWithPhotos } = useQuery({
    queryKey: ['rolls', 'with-photos'],
    queryFn: async () => {
      const rollsWithData = await Promise.all(
        rolls.map(async (roll) => {
          try {
            const photos = await getPhotosByRoll(roll.id);
            const coverPhoto = photos.find(p => p.is_cover) || photos[0];
            return { roll, coverPhoto, photoCount: photos.length };
          } catch {
            return { roll, coverPhoto: undefined, photoCount: 0 };
          }
        })
      );
      return rollsWithData;
    },
    enabled: rolls.length > 0,
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (options: ImportOptions) => importFolder(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolls'] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (request: UpdateRollRequest) => updateRoll(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolls'] });
    },
  });

  const handleImport = async (options: ImportOptions) => {
    await importMutation.mutateAsync(options);
  };

  const handleEdit = async (roll: Roll) => {
    setSelectedRoll(roll);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (roll: Roll) => {
    await updateMutation.mutateAsync({
      id: roll.id,
      name: roll.name,
      film_stock: roll.film_stock,
      camera: roll.camera,
      lens: roll.lens,
      shoot_date: roll.shoot_date,
      lab_info: roll.lab_info,
      notes: roll.notes,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎞️</div>
            <div>
              <h1 className="text-xl font-bold text-white">FilmVault</h1>
              <p className="text-xs text-zinc-500">Film Photography Management</p>
            </div>
          </div>

          <Button
            onClick={() => setIsImportDialogOpen(true)}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Import Roll
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-zinc-500">Loading rolls...</div>
          </div>
        ) : rolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="text-8xl mb-6">📷</div>
            <h2 className="text-2xl font-semibold text-white mb-2">No Rolls Yet</h2>
            <p className="text-zinc-500 mb-6 max-w-md">
              Import your first film roll to get started. Select a folder of photos and we'll organize them for you.
            </p>
            <Button
              onClick={() => setIsImportDialogOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Import Your First Roll
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8 flex items-center gap-6 text-sm text-zinc-500">
              <span>{rolls.length} rolls</span>
              <span>·</span>
              <span>Library: {libraryRoot}</span>
            </div>

            {/* Rolls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rollsWithPhotos?.map(({ roll, coverPhoto, photoCount }) => (
                <RollCard
                  key={roll.id}
                  roll={roll}
                  coverPhoto={coverPhoto}
                  photoCount={photoCount}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Dialogs */}
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImport}
        libraryRoot={libraryRoot}
      />

      <EditMetadataForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        roll={selectedRoll}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
