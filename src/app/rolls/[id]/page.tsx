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

  // Fetch roll data with photos
  const { data: rollData, isLoading, error } = useQuery({
    queryKey: ['roll', rollId],
    queryFn: () => getRollWithPhotos(rollId),
  });

  const roll = rollData?.roll;
  const photos = rollData?.photos || [];

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
      router.push('/'); // Navigate back to home after successful deletion
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

  const handleConfirmDelete = async (deleteFiles: boolean, deleteOriginals: boolean) => {
    if (!roll) return;
    await deleteMutation.mutateAsync({
      id: roll.id,
      delete_files: deleteFiles,
      delete_originals: deleteOriginals,
    });
  };

  // Handle delete photos
  const handleDeletePhotos = () => {
    if (selectedPhotos.size === 0) return;
    const selectedPhotoObjects = photos.filter(p => selectedPhotos.has(p.id));
    setSelectedPhotosForDelete(selectedPhotoObjects);
    setIsDeletePhotosDialogOpen(true);
  };

  const handleConfirmDeletePhotos = async (deleteFiles: boolean) => {
    const photoIds = Array.from(selectedPhotos);
    await deletePhotosMutation.mutateAsync({
      photo_ids: photoIds,
      delete_files: deleteFiles,
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

  const handleSelectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
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
        photoCount={photos.length}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="text-8xl mb-6">📷</div>
            <h2 className="text-2xl font-semibold text-white mb-2">还没有照片</h2>
            <p className="text-zinc-500">
              这个胶卷还没有照片。
            </p>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            selectedPhotos={selectedPhotos}
            onPhotoClick={handlePhotoClick}
            onToggleSelection={handleToggleSelection}
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
