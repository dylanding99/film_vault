'use client';

import { PhotoGridItem } from './PhotoGridItem';
import type { Photo } from '@/types/roll';

interface PhotoGridProps {
  photos: Photo[];
  selectedPhotos: Set<number>;
  onPhotoClick: (photo: Photo, index: number) => void;
  onToggleSelection: (photoId: number) => void;
  onToggleFavorite: (photoId: number) => void;
}

export function PhotoGrid({
  photos,
  selectedPhotos,
  onPhotoClick,
  onToggleSelection,
  onToggleFavorite,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {photos.map((photo, index) => (
        <PhotoGridItem
          key={photo.id}
          photo={photo}
          index={index}
          isSelected={selectedPhotos.has(photo.id)}
          onClick={onPhotoClick}
          onToggleSelect={onToggleSelection}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
