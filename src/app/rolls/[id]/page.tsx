'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RollDetailHeader } from '@/components/RollDetailHeader';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoPreviewDialog } from '@/components/PhotoPreviewDialog';
import { BatchSelectionBar } from '@/components/BatchSelectionBar';
import { DeleteRollDialog } from '@/components/DeleteRollDialog';
import { DeletePhotosDialog } from '@/components/DeletePhotosDialog';
import { EditMetadataForm } from '@/components/EditMetadataForm';
import { AddPhotosDialog } from '@/components/AddPhotosDialog';
import {
  getRollWithPhotos,
  updateRoll,
  deleteRoll,
  deletePhotos,
  setPhotoAsCover,
  togglePhotoFavorite,
  addPhotosToRoll,
} from '@/lib/db';
import type { Roll, Photo, UpdateRollRequest, DeleteRollRequest, AddPhotosOptions } from '@/types/roll';

export default function RollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rollId = Number(params.id);

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePhotosDialogOpen, setIsDeletePhotosDialogOpen] = useState(false);
  const [isAddPhotosDialogOpen, setIsAddPhotosDialogOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<Roll | null>(null);
  const [selectedPhotosForDelete, setSelectedPhotosForDelete] = useState<Photo[]>([]);

  // Photo preview states
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Batch selection states
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());

  // Filter state
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch all film presets
  const { data: filmPresets = [] } = useQuery({
    queryKey: ['film-presets'],
    queryFn: () => import('@/lib/db').then(db => db.getFilmPresets()),
  });

  // Fetch roll data with photos
  const { data: rollData, isLoading, error } = useQuery({
    queryKey: ['roll', rollId],
    queryFn: () => getRollWithPhotos(rollId),
  });

  const roll = rollData?.roll;
  const allPhotos = rollData?.photos || [];

  // Find matching preset for this roll
  const preset = roll ? filmPresets.find(p => p.name === roll.film_stock) : undefined;

  // Filter photos based on favorite status
  const photos = showFavoritesOnly
    ? allPhotos.filter(p => p.is_favorite)
    : allPhotos;

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (request: UpdateRollRequest) => updateRoll(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roll', rollId] });
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (request: DeleteRollRequest) => deleteRoll(request),
    onSuccess: async (_, variables) => {
      // Immediately remove the deleted roll from cache
      queryClient.setQueryData<Roll[]>(['rolls'], (oldData) => {
        return oldData?.filter(roll => roll.id !== variables.id) ?? [];
      });

      queryClient.setQueryData<{ roll: Roll; coverPhoto?: Photo; photoCount: number }[]>(
        ['rolls', 'with-photos'],
        (oldData) => {
          return oldData?.filter(item => item.roll.id !== variables.id) ?? [];
        }
      );

      // Invalidate queries to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
      await queryClient.invalidateQueries({ queryKey: ['rolls', 'with-photos'] });

      // Close dialog and navigate
      setIsDeleteDialogOpen(false);
      router.push('/');
    },
    onError: (error: Error) => {
      console.error('Failed to delete roll:', error);
      alert(`Failed to delete roll: ${error.message}`);
    },
  });

  // Delete photos mutation
  const deletePhotosMutation = useMutation({
    mutationFn: (request: { photo_ids: number[]; delete_files: boolean }) =>
      deletePhotos(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roll', rollId] });
      setSelectedPhotos(new Set());
    },
    onError: (error: Error) => {
      console.error('Failed to delete photos:', error);
      alert(`删除照片失败: ${error.message}`);
    },
  });

  // Add photos mutation
  const addPhotosMutation = useMutation({
    mutationFn: (options: AddPhotosOptions) => addPhotosToRoll(options),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roll', rollId] });
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
      setIsAddPhotosDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Failed to add photos:', error);
      alert(`添加照片失败: ${error.message}`);
    },
  });

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle edit roll
  const handleEdit = (roll: Roll) => {
    setSelectedRoll(roll);
    setIsEditDialogOpen(true);
  };

  // Handle save edit
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
      city: roll.city,
      country: roll.country,
      lat: roll.lat,
      lon: roll.lon,
    });
  };

  // Handle delete roll
  const handleDelete = (roll: Roll) => {
    setSelectedRoll(roll);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roll) return;
    await deleteMutation.mutateAsync({
      id: roll.id,
      delete_files: true,
      delete_originals: true,
    });
  };

  // Handle delete photos
  const handleDeletePhotos = () => {
    if (selectedPhotos.size === 0) return;
    const selectedPhotoObjects = photos.filter(p => selectedPhotos.has(p.id));
    setSelectedPhotosForDelete(selectedPhotoObjects);
    setIsDeletePhotosDialogOpen(true);
  };

  // Handle add photos
  const handleAddPhotos = async (options: AddPhotosOptions) => {
    await addPhotosMutation.mutateAsync(options);
  };

  const handleOpenAddPhotosDialog = () => {
    if (!roll) return;
    setIsAddPhotosDialogOpen(true);
  };

  const handleConfirmDeletePhotos = async () => {
    const photoIds = Array.from(selectedPhotos);
    await deletePhotosMutation.mutateAsync({
      photo_ids: photoIds,
      delete_files: true,
    });
    setIsDeletePhotosDialogOpen(false);
  };

  // Handle photo click (open preview)
  const handlePhotoClick = (photo: Photo, index: number) => {
    setPreviewPhoto(photo);
    setPreviewIndex(index);
  };

  // Handle close preview
  const handleClosePreview = () => {
    setPreviewPhoto(null);
  };

  // Handle navigate preview
  const handleNavigatePreview = (direction: 'prev' | 'next') => {
    if (photos.length === 0) return;

    const newIndex = direction === 'next'
      ? (previewIndex + 1) % photos.length
      : (previewIndex - 1 + photos.length) % photos.length;

    setPreviewIndex(newIndex);
    setPreviewPhoto(photos[newIndex]);
  };

  // Handle select all (only select visible photos)
  const handleSelectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    setSelectedPhotos(new Set());
  };

  // Handle photo selection
  const handleToggleSelection = (photoId: number) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedPhotos(new Set());
  };

  // Handle set as cover
  const handleSetCover = async (rollId: number, photoId: number) => {
    try {
      await setPhotoAsCover(rollId, photoId);
      await queryClient.invalidateQueries({ queryKey: ['roll', rollId] });
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
    } catch (error) {
      console.error('Failed to set cover:', error);
      alert(`设置封面失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (photoId: number) => {
    try {
      await togglePhotoFavorite(photoId);

      // Refetch queries to get updated data
      await queryClient.refetchQueries({ queryKey: ['roll', rollId] });
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });

      // Update previewPhoto state if the toggled photo is currently being previewed
      if (previewPhoto && previewPhoto.id === photoId) {
        // Get the updated data from cache
        const cachedData = queryClient.getQueryData<{ roll: Roll; photos: Photo[] }>(['roll', rollId]);
        if (cachedData) {
          const updatedPhoto = cachedData.photos.find(p => p.id === photoId);
          if (updatedPhoto) {
            setPreviewPhoto(updatedPhoto);
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert(`收藏操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // Reset preview and selection when filter changes
  useEffect(() => {
    setPreviewIndex(0);
    setPreviewPhoto(null);
    setSelectedPhotos(new Set());
  }, [showFavoritesOnly]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep flex flex-col items-center justify-center gap-6">
        <div className="logo-mark animate-pulse w-12 h-12" />
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-color-brand animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-color-brand animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-color-brand animate-bounce" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !roll) {
    return (
      <div className="min-h-screen bg-deep flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-accent-rose blur-2xl opacity-20" />
            <div className="relative w-24 h-24 flex items-center justify-center rounded-3xl bg-surface border border-accent-rose/20 mx-auto">
              <Trash2 className="w-12 h-12 text-accent-rose" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-3xl font-medium text-primary mb-3 tracking-tight">未找到胶卷</h1>
            <p className="text-secondary text-body leading-relaxed">该胶卷可能已被移动或删除，无法获取其详细信息。</p>
          </div>
          <Button onClick={handleBack} className="btn-secondary btn-lg w-full gap-3">
            <ArrowLeft className="h-4 w-4" />
            <span>返回档案库</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep flex flex-col relative overflow-x-hidden">
      {/* Cinematic Background Glow - Matches preset brand color */}
      {preset && (
        <div 
          className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] opacity-20 pointer-events-none blur-[120px] z-0 transition-all duration-1000 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${preset.brand_color.replace('bg-', 'var(--') || 'hsl(var(--color-brand))'} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Header */}
      <RollDetailHeader
        roll={roll}
        photoCount={allPhotos.length}
        preset={preset}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddPhotos={handleOpenAddPhotosDialog}
      />
      
      <div className="flex-1 pt-32 pb-32 relative z-10">
        {/* Filter Bar - Editorial Style */}
        {allPhotos.length > 0 && (
          <div className="container mx-auto px-6 mb-10 animate-fade-in">
            <div className="flex items-center justify-between py-4 border-y border-white/5">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setShowFavoritesOnly(false)}
                  className={`text-xs font-mono uppercase tracking-[0.2em] transition-all ${!showFavoritesOnly ? 'text-primary' : 'text-tertiary hover:text-secondary'}`}
                >
                  全部存档 {!showFavoritesOnly && <span className="ml-1 opacity-50">({allPhotos.length})</span>}
                </button>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <button 
                  onClick={() => setShowFavoritesOnly(true)}
                  className={`text-xs font-mono uppercase tracking-[0.2em] transition-all ${showFavoritesOnly ? 'text-color-brand' : 'text-tertiary hover:text-secondary'}`}
                >
                  收藏馆 {showFavoritesOnly && <span className="ml-1 opacity-50">({photos.length})</span>}
                </button>
              </div>

              <div className="hidden sm:block text-[10px] font-mono text-tertiary uppercase tracking-widest opacity-50">
                Index: 001 — {String(allPhotos.length).padStart(3, '0')}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-6">
          {photos.length === 0 ? (
            <div className="py-12">
              <EmptyState
                type={showFavoritesOnly ? 'no-results' : 'no-rolls'}
                message={showFavoritesOnly ? '档案馆中没有收藏' : '此卷尚无影像'}
                submessage={showFavoritesOnly 
                  ? '您还没有为这个胶卷中的照片标记过收藏。' 
                  : '此胶卷尚未导入任何照片，点击下方按钮开始丰富您的收藏。'
                }
                action={!showFavoritesOnly ? {
                  label: '导入第一张照片',
                  onClick: handleOpenAddPhotosDialog,
                } : {
                  label: '显示所有照片',
                  onClick: () => setShowFavoritesOnly(false),
                }}
              />
            </div>
          ) : (
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <PhotoGrid
                photos={photos}
                selectedPhotos={selectedPhotos}
                onPhotoClick={handlePhotoClick}
                onToggleSelection={handleToggleSelection}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          )}
        </main>
      </div>

      {/* Batch Selection Bar */}
      {selectedPhotos.size > 0 && (
        <BatchSelectionBar
          selectedCount={selectedPhotos.size}
          totalCount={photos.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onClearSelection={handleClearSelection}
          onDelete={handleDeletePhotos}
          itemType="photo"
        />
      )}

      {/* Photo Preview Dialog */}
      {previewPhoto && (
        <PhotoPreviewDialog
          photo={previewPhoto}
          index={previewIndex}
          total={photos.length}
          rollId={roll.id}
          rollCity={roll.city}
          rollCountry={roll.country}
          onClose={handleClosePreview}
          onNavigate={handleNavigatePreview}
          onSetCover={handleSetCover}
          onToggleFavorite={handleToggleFavorite}
          onPhotoUpdate={async () => {
            await queryClient.invalidateQueries({ queryKey: ['roll', rollId] });
            await queryClient.refetchQueries({ queryKey: ['roll', rollId] });
          }}
        />
      )}

      {/* Edit Metadata Dialog */}
      <EditMetadataForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        roll={selectedRoll}
        onSave={handleSaveEdit}
      />

      {/* Delete Roll Dialog */}
      <DeleteRollDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        roll={selectedRoll}
        photoCount={photos.length}
        onDelete={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      {/* Delete Photos Dialog */}
      <DeletePhotosDialog
        open={isDeletePhotosDialogOpen}
        onOpenChange={setIsDeletePhotosDialogOpen}
        photos={selectedPhotosForDelete}
        onDelete={handleConfirmDeletePhotos}
        isDeleting={deletePhotosMutation.isPending}
      />

      {/* Add Photos Dialog */}
      {roll && (
        <AddPhotosDialog
          open={isAddPhotosDialogOpen}
          onOpenChange={setIsAddPhotosDialogOpen}
          onAddPhotos={handleAddPhotos}
          roll={roll}
        />
      )}
    </div>
  );
}
