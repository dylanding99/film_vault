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
import { getRollWithPhotos, updateRoll, deleteRoll, deletePhotos } from '@/lib/db';
import type { Roll, Photo, UpdateRollRequest, DeleteRollRequest } from '@/types/roll';

export default function RollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rollId = Number(params.id);

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePhotosDialogOpen, setIsDeletePhotosDialogOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<Roll | null>(null);
  const [selectedPhotosForDelete, setSelectedPhotosForDelete] = useState<Photo[]>([]);

  // Photo preview states
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Batch selection states
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());

  // Filter state
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch roll data with photos
  const { data: rollData, isLoading, error } = useQuery({
    queryKey: ['roll', rollId],
    queryFn: () => getRollWithPhotos(rollId),
  });

  const roll = rollData?.roll;
  const allPhotos = rollData?.photos || [];

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
      const { setPhotoAsCover } = await import('@/lib/db');
      await setPhotoAsCover(rollId, photoId);
      await queryClient.invalidateQueries({ queryKey: ['roll', rollId] });
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
    } catch (error) {
      console.error('Failed to set cover:', error);
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (photoId: number) => {
    try {
      const { togglePhotoFavorite } = await import('@/lib/db');
      await togglePhotoFavorite(photoId);

      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['roll', rollId] });
      await queryClient.refetchQueries({ queryKey: ['roll', rollId] });
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });

      // Update previewPhoto state if the toggled photo is currently being previewed
      if (previewPhoto && previewPhoto.id === photoId) {
        // Fetch updated photo data from refetched query
        await queryClient.refetchQueries({ queryKey: ['roll', rollId] });

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-zinc-500">加载中...</div>
      </div>
    );
  }

  // Error state
  if (error || !roll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-zinc-500">未找到胶卷</div>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <RollDetailHeader
        roll={roll}
        photoCount={allPhotos.length}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Filter Bar */}
      {allPhotos.length > 0 && (
        <div className="container mx-auto px-6 py-4 border-b border-zinc-800">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500 focus:ring-offset-0"
            />
            <span className="text-sm text-zinc-300">
              只显示收藏 {showFavoritesOnly && `(${photos.length}/${allPhotos.length})`}
            </span>
          </label>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="text-8xl mb-6">📷</div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {showFavoritesOnly ? '没有收藏照片' : '还没有照片'}
            </h2>
            <p className="text-zinc-500">
              {showFavoritesOnly
                ? '这个胶卷还没有收藏的照片。取消筛选以查看所有照片。'
                : '这个胶卷还没有照片。'
              }
            </p>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            selectedPhotos={selectedPhotos}
            onPhotoClick={handlePhotoClick}
            onToggleSelection={handleToggleSelection}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>

      {/* Batch Selection Bar */}
      {selectedPhotos.size > 0 && (
        <BatchSelectionBar
          selectedCount={selectedPhotos.size}
          totalCount={photos.length}
          onSelectAll={handleSelectAll}
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
    </div>
  );
}
