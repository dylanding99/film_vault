'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, CheckSquare } from 'lucide-react';
import { RollCard } from '@/components/RollCard';
import { ImportDialog } from '@/components/ImportDialog';
import { EditMetadataForm } from '@/components/EditMetadataForm';
import { SettingsDialog } from '@/components/SettingsDialog';
import { BatchSelectionBar } from '@/components/BatchSelectionBar';
import { DeleteRollDialog } from '@/components/DeleteRollDialog';
import { Button } from '@/components/ui/button';
import {
  getAllRolls,
  importFolder,
  updateRoll,
  getPhotosByRoll,
  getLibraryRoot,
  updateLibraryRoot,
  deleteRoll,
} from '@/lib/db';
import type { Roll, Photo, ImportOptions, UpdateRollRequest, DeleteRollRequest } from '@/types/roll';

export default function HomePage() {
  const queryClient = useQueryClient();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<Roll | null>(null);
  const [libraryRoot, setLibraryRoot] = useState<string>('');

  // Batch selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRolls, setSelectedRolls] = useState<Set<number>>(new Set());

  // Load library root from config
  useEffect(() => {
    getLibraryRoot().then(setLibraryRoot).catch(console.error);
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
            console.log('[Roll', roll.id, '] Photos:', photos);
            const coverPhoto = photos.find(p => p.is_cover) || photos[0];
            console.log('[Roll', roll.id, '] Cover photo:', coverPhoto);
            return { roll, coverPhoto, photoCount: photos.length };
          } catch (e) {
            console.error('[Roll', roll.id, '] Error fetching photos:', e);
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
    onSuccess: async (data) => {
      console.log('[Import] Import successful, roll_id:', data.roll_id, 'photos_count:', data.photos_count);

      // Cancel any ongoing queries
      await queryClient.cancelQueries({ queryKey: ['rolls'] });
      await queryClient.cancelQueries({ queryKey: ['rolls', 'with-photos'] });

      // Reset queries to force hard refetch (more aggressive than invalidate)
      await queryClient.resetQueries({ queryKey: ['rolls'] });
      await queryClient.resetQueries({ queryKey: ['rolls', 'with-photos'] });

      // Refetch to ensure we have the latest data
      await queryClient.refetchQueries({ queryKey: ['rolls'] });

      // Wait a bit for the rolls query to complete before refetching with-photos
      await new Promise(resolve => setTimeout(resolve, 100));

      await queryClient.refetchQueries({ queryKey: ['rolls', 'with-photos'] });

      console.log('[Import] Queries refetched, closing dialog');

      // Close dialog after data is refreshed
      setIsImportDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Import failed:', error);
      alert(`导入失败: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (request: UpdateRollRequest) => updateRoll(request),
    onSuccess: async () => {
      // Refetch queries and wait for completion to ensure UI shows updated data
      await queryClient.refetchQueries({ queryKey: ['rolls'] });
      await queryClient.refetchQueries({ queryKey: ['rolls', 'with-photos'] });
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

  const handleSaveSettings = async (path: string) => {
    await updateLibraryRoot(path);
    setLibraryRoot(path);
    // Refetch queries to update any paths
    await queryClient.refetchQueries({ queryKey: ['rolls'] });
  };

  // Delete roll mutation
  const deleteMutation = useMutation({
    mutationFn: (request: DeleteRollRequest) => deleteRoll(request),
    onSuccess: async (_, variables) => {
      // Remove the deleted roll from cache immediately
      queryClient.setQueryData<Roll[]>(['rolls'], (oldData) => {
        return oldData?.filter(roll => roll.id !== variables.id) ?? [];
      });

      // Also update the with-photos query
      queryClient.setQueryData<{ roll: Roll; coverPhoto?: Photo; photoCount: number }[]>(
        ['rolls', 'with-photos'],
        (oldData) => {
          return oldData?.filter(item => item.roll.id !== variables.id) ?? [];
        }
      );

      // Then invalidate to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
      await queryClient.invalidateQueries({ queryKey: ['rolls', 'with-photos'] });

      // Close dialog and clear selection
      setSelectedRolls(new Set());
      setSelectionMode(false);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Failed to delete roll:', error);
      alert(`删除胶卷失败: ${error.message}`);
    },
  });

  // Toggle selection mode
  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedRolls(new Set());
  };

  // Toggle roll selection
  const handleToggleRollSelection = (rollId: number) => {
    const newSelected = new Set(selectedRolls);
    if (newSelected.has(rollId)) {
      newSelected.delete(rollId);
    } else {
      newSelected.add(rollId);
    }
    setSelectedRolls(newSelected);
  };

  // Select all rolls
  const handleSelectAllRolls = () => {
    if (rolls.length > 0) {
      setSelectedRolls(new Set(rolls.map(r => r.id)));
    }
  };

  // Clear roll selection
  const handleClearRollSelection = () => {
    setSelectedRolls(new Set());
    setSelectionMode(false);
  };

  // Handle delete rolls
  const handleDeleteRolls = () => {
    if (selectedRolls.size > 0) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDeleteRoll = async () => {
    // Immediately remove deleted rolls from cache to prevent loading deleted files
    const deletedIds = Array.from(selectedRolls);

    queryClient.setQueryData<Roll[]>(['rolls'], (oldData) => {
      return oldData?.filter(roll => !deletedIds.includes(roll.id)) ?? [];
    });

    queryClient.setQueryData<{ roll: Roll; coverPhoto?: Photo; photoCount: number }[]>(
      ['rolls', 'with-photos'],
      (oldData) => {
        return oldData?.filter(item => !deletedIds.includes(item.roll.id)) ?? [];
      }
    );

    // Delete each selected roll with all files
    for (const rollId of selectedRolls) {
      try {
        await deleteRoll({
          id: rollId,
          delete_files: true,
          delete_originals: true,
        });
      } catch (error) {
        console.error(`Failed to delete roll ${rollId}:`, error);
      }
    }

    // Refresh data to ensure consistency
    await queryClient.invalidateQueries({ queryKey: ['rolls'] });
    await queryClient.invalidateQueries({ queryKey: ['rolls', 'with-photos'] });

    // Close dialog and clear selection
    setSelectedRolls(new Set());
    setSelectionMode(false);
    setIsDeleteDialogOpen(false);
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsDialogOpen(true)}
              title="设置"
            >
              <Settings className="h-5 w-5" />
            </Button>
            {rolls.length > 0 && (
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="icon"
                onClick={handleToggleSelectionMode}
                title={selectionMode ? "退出选择模式" : "进入选择模式"}
              >
                <CheckSquare className="h-5 w-5" />
              </Button>
            )}
            <Button
              onClick={() => setIsImportDialogOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              导入胶卷
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-zinc-500">加载中...</div>
          </div>
        ) : rolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="text-8xl mb-6">📷</div>
            <h2 className="text-2xl font-semibold text-white mb-2">还没有胶卷</h2>
            <p className="text-zinc-500 mb-6 max-w-md">
              导入您的第一个胶卷开始使用。选择一个包含照片的文件夹，我们会为您整理。
            </p>
            <Button
              onClick={() => setIsImportDialogOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              导入第一个胶卷
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8 flex items-center gap-6 text-sm text-zinc-500">
              <span>{rolls.length} 个胶卷</span>
              <span>·</span>
              <span>图库: {libraryRoot}</span>
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
                  selectionMode={selectionMode}
                  selected={selectedRolls.has(roll.id)}
                  onToggleSelection={handleToggleRollSelection}
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

      <SettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        currentLibraryRoot={libraryRoot}
        onSave={handleSaveSettings}
      />

      {/* Batch Selection Bar */}
      {selectedRolls.size > 0 && (
        <BatchSelectionBar
          selectedCount={selectedRolls.size}
          totalCount={rolls.length}
          onSelectAll={handleSelectAllRolls}
          onClearSelection={handleClearRollSelection}
          onDelete={handleDeleteRolls}
          itemType="roll"
        />
      )}

      {/* Delete Roll Dialog */}
      <DeleteRollDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deleteCount={selectedRolls.size}
        onDelete={handleConfirmDeleteRoll}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
