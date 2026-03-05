'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { CheckSquare, Film, Loader2, Upload, Settings } from 'lucide-react';
import { RollCard } from '@/components/RollCard';
import { RollFilters } from '@/components/RollFilters';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ImportDialog } from '@/components/ImportDialog';
import { EditMetadataForm } from '@/components/EditMetadataForm';
import { SettingsDialog } from '@/components/SettingsDialog';
import { BatchSelectionBar } from '@/components/BatchSelectionBar';
import { DeleteRollDialog } from '@/components/DeleteRollDialog';
import { EmptyState } from '@/components/EmptyState';
import {
  getAllRolls,
  importFolder,
  updateRoll,
  getPhotosByRoll,
  getLibraryRoot,
  updateLibraryRoot,
  deleteRoll,
  getConfig,
} from '@/lib/db';
import { filterRolls, searchParamsToFilters, filtersToSearchParams } from '@/lib/filter-utils';
import type { Roll, Photo, ImportOptions, UpdateRollRequest, DeleteRollRequest } from '@/types/roll';
import type { RollFilters as RollFiltersType } from '@/types/filter';

// Main page content component with searchParams
function HomePageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Dialog states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<Roll | null>(null);

  // Batch selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRolls, setSelectedRolls] = useState<Set<number>>(new Set());

  // Page loading state
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Initialize filters from URL search params
  const initialFilters = useMemo(() => {
    const urlFilters = searchParamsToFilters(searchParams);
    return {
      searchTerm: urlFilters.searchTerm || '',
      filmStock: urlFilters.filmStock || 'all',
      camera: urlFilters.camera || 'all',
      dateRange: urlFilters.dateRange || { from: null, to: null },
      hasFavorites: urlFilters.hasFavorites || false,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<RollFiltersType>(initialFilters);

  // Sync filters with URL params (for page refresh scenarios)
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Update URL when filters change
  useEffect(() => {
    const params = filtersToSearchParams(filters);
    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  // Fetch config (including library root) using React Query
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    staleTime: 1000,
  });

  const libraryRoot = config?.library_root || '';

  // Fetch all rolls
  const { data: rolls = [], isLoading: isRollsLoading } = useQuery({
    queryKey: ['rolls'],
    queryFn: getAllRolls,
  });

  // Fetch all film presets
  const { data: filmPresets = [], isLoading: isPresetsLoading } = useQuery({
    queryKey: ['film-presets'],
    queryFn: () => import('@/lib/db').then(db => db.getFilmPresets()),
  });

  // Fetch photos for each roll to get cover images and favorite count
  const { data: rollsWithPhotos } = useQuery({
    queryKey: ['rolls', 'with-photos', filmPresets.length], // Include filmPresets.length to re-run when presets are loaded
    queryFn: async () => {
      const rollsWithData = await Promise.all(
        rolls.map(async (roll) => {
          try {
            const photos = await getPhotosByRoll(roll.id);
            const coverPhoto = photos.find(p => p.is_cover) || photos[0];
            const favoriteCount = photos.filter(p => p.is_favorite).length;

            // Find matching preset for this roll
            const preset = filmPresets.find(p => p.name === roll.film_stock);

            const rollWithCount = { ...roll, favoriteCount } as Roll & { favoriteCount: number };
            return { roll: rollWithCount, coverPhoto, photoCount: photos.length, preset };
          } catch (e) {
            console.error('[Roll', roll.id, '] Error fetching photos:', e);
            return { roll, coverPhoto: undefined, photoCount: 0, favoriteCount: 0, preset: undefined };
          }
        })
      );
      return rollsWithData;
    },
    enabled: rolls.length > 0,
  });

  // Apply filters to rolls
  const filteredRolls = useMemo(() => {
    const rollList = rollsWithPhotos?.map(item => item.roll) || [];
    return filterRolls(rollList, filters);
  }, [rollsWithPhotos, filters]);

  // Get filtered rolls with photos data
  const filteredRollsWithPhotos = useMemo(() => {
    if (!rollsWithPhotos) return [];
    const filteredIds = new Set(filteredRolls.map(r => r.id));
    return rollsWithPhotos.filter(item => filteredIds.has(item.roll.id));
  }, [rollsWithPhotos, filteredRolls]);

  // Page loading state - hide skeleton after data is ready
  useEffect(() => {
    if (!isConfigLoading && !isRollsLoading && rolls.length > 0) {
      const timer = setTimeout(() => setIsPageLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isConfigLoading, isRollsLoading, rolls.length]);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (options: ImportOptions) => importFolder(options),
    onSuccess: async (data) => {
      // Cancel any ongoing queries
      await queryClient.cancelQueries({ queryKey: ['rolls'] });
      await queryClient.cancelQueries({ queryKey: ['rolls', 'with-photos'] });

      // Reset queries to force hard refetch
      await queryClient.resetQueries({ queryKey: ['rolls'] });
      await queryClient.resetQueries({ queryKey: ['rolls', 'with-photos'] });

      // Refetch to ensure we have the latest data
      await queryClient.refetchQueries({ queryKey: ['rolls'] });

      // Wait a bit for rolls query to complete before refetching with-photos
      await new Promise(resolve => setTimeout(resolve, 100));

      await queryClient.refetchQueries({ queryKey: ['rolls', 'with-photos'] });

      setIsImportDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Import failed:', error);
      alert(`导入失败: ${error.message}`);
    },
  });

  // Update roll mutation
  const updateMutation = useMutation({
    mutationFn: (request: UpdateRollRequest) => updateRoll(request),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
      await queryClient.invalidateQueries({ queryKey: ['rolls', 'with-photos'] });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Failed to update roll:', error);
      alert(`更新胶卷失败: ${error.message}`);
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
      city: roll.city,
      country: roll.country,
      lat: roll.lat,
      lon: roll.lon,
    });
  };

  const handleSaveSettings = async (path: string) => {
    await updateLibraryRoot(path);
    await queryClient.invalidateQueries({ queryKey: ['config'] });
    await queryClient.refetchQueries({ queryKey: ['config'] });
    await queryClient.refetchQueries({ queryKey: ['rolls'] });
  };

  // Delete roll mutation
  const deleteMutation = useMutation({
    mutationFn: (request: DeleteRollRequest) => deleteRoll(request),
    onSuccess: async (_, variables) => {
      queryClient.setQueryData<Roll[]>(['rolls'], (oldData) => {
        return oldData?.filter(roll => roll.id !== variables.id) ?? [];
      });

      queryClient.setQueryData<{ roll: Roll; coverPhoto?: Photo; photoCount: number }[]>(
        ['rolls', 'with-photos'],
        (oldData) => {
          return oldData?.filter(item => item.roll.id !== variables.id) ?? [];
        }
      );

      await queryClient.invalidateQueries({ queryKey: ['rolls'] });
      await queryClient.invalidateQueries({ queryKey: ['rolls', 'with-photos'] });

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

  // Select all rolls (only visible/filtered rolls)
  const handleSelectAllRolls = () => {
    if (filteredRolls.length > 0) {
      setSelectedRolls(new Set(filteredRolls.map(r => r.id)));
    }
  };

  // Deselect all rolls
  const handleDeselectAllRolls = () => {
    setSelectedRolls(new Set());
  };

  // Clear roll selection and exit selection mode
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

    await queryClient.invalidateQueries({ queryKey: ['rolls'] });
    await queryClient.invalidateQueries({ queryKey: ['rolls', 'with-photos'] });

    setSelectedRolls(new Set());
    setSelectionMode(false);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div style={{ background: 'hsl(var(--bg-deep))', minHeight: '100vh' }}>
      {/* Page Loading Animation - The Film Vault Ocean */}
      {isPageLoading ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[100] bg-deep overflow-hidden">
          {/* Cinematic Background Glows */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-color-brand/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-color-brand/5 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '6s' }} />
          
          {/* The Card Ocean - Floating Silhouettes */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {[...Array(12)].map((_, i) => {
              const delay = i * 200;
              const size = 120 + (i % 4) * 40;
              const left = `${(i * 17) % 100}%`;
              const top = `${(i * 13) % 100}%`;
              const opacity = 0.02 + (i % 5) * 0.02;
              const rotate = (i * 15) % 45 - 22;
              
              return (
                <div
                  key={i}
                  className="loading-ocean-card"
                  style={{
                    width: `${size}px`,
                    height: `${size * 1.3}px`,
                    left,
                    top,
                    opacity,
                    transform: `rotate(${rotate}deg)`,
                    animationDelay: `${delay}ms, ${delay + 1000}ms`,
                    animationDuration: '1.2s, 12s',
                  }}
                >
                  {/* Internal card details silhouette */}
                  <div className="absolute top-2 left-2 right-2 h-2/3 bg-white/5 rounded-sm" />
                  <div className="absolute bottom-4 left-2 w-1/2 h-2 bg-white/10 rounded-full" />
                  <div className="absolute bottom-2 left-2 w-1/3 h-1.5 bg-white/5 rounded-full" />
                </div>
              );
            })}
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in-up">
            {/* Animated Central Logo Mark */}
            <div className="relative group">
              <div className="absolute inset-0 bg-color-brand blur-2xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
              <div 
                className="logo-mark w-20 h-20 relative z-10 scale-125 border border-white/10 shadow-glow"
                style={{ animation: 'scaleIn 0.8s var(--ease-out-quint)' }}
              />
            </div>

            {/* Loading Status Text */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-xl font-display font-medium text-white tracking-[0.2em] uppercase">
                  FilmVault
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
              </div>
              
              <div className="flex items-center gap-2 text-[10px] font-mono text-tertiary uppercase tracking-[0.4em] mt-1 ml-1">
                <Loader2 className="w-3 h-3 animate-spin text-color-brand" />
                <span>Initializing Archive</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <Header
            rollsCount={rolls.length}
            selectionMode={selectionMode}
            selectedCount={selectedRolls.size}
            onToggleSelectionMode={handleToggleSelectionMode}
            onOpenSettings={() => setIsSettingsDialogOpen(true)}
            onOpenImport={() => setIsImportDialogOpen(true)}
          />

          {/* Main Content */}
          <main className="page-container" style={{ paddingTop: '100px' }}>
            {isRollsLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-tertiary" />
              </div>
            ) : rolls.length === 0 ? (
              <EmptyState
                type="no-rolls"
                message="开始您的胶片之旅"
                submessage="导入第一个胶卷，记录每一次快门释放的瞬间"
                action={{
                  label: '导入第一个胶卷',
                  onClick: () => setIsImportDialogOpen(true),
                }}
              />
            ) : (
              <>
                {/* Filters */}
                <RollFilters
                  rolls={rolls}
                  filters={filters}
                  onFiltersChange={setFilters}
                />

                {/* Result Count */}
                <div className="mb-6 text-tertiary font-mono text-xs">
                  {filteredRolls.length === rolls.length ? (
                    <span>共 {rolls.length} 个胶卷</span>
                  ) : (
                    <span>
                      找到 {filteredRolls.length} 个胶卷（共 {rolls.length} 个）
                    </span>
                  )}
                </div>

                {/* Rolls Grid */}
                {filteredRollsWithPhotos.length === 0 ? (
                  <EmptyState
                    type="no-results"
                    message="没有找到匹配的胶卷"
                    submessage="尝试调整您的搜索条件"
                    action={{
                      label: '清除筛选条件',
                      onClick: () => setFilters({
                        searchTerm: '',
                        filmStock: 'all',
                        camera: 'all',
                        dateRange: { from: null, to: null },
                        hasFavorites: false,
                      }),
                    }}
                  />
                ) : (
                  <div className="grid-gallery">
                    {filteredRollsWithPhotos.map(({ roll, coverPhoto, photoCount, preset }, index) => (
                      <RollCard
                        key={roll.id}
                        roll={roll}
                        coverPhoto={coverPhoto}
                        photoCount={photoCount}
                        preset={preset}
                        onEdit={handleEdit}
                        selectionMode={selectionMode}
                        selected={selectedRolls.has(roll.id)}
                        onToggleSelection={handleToggleRollSelection}
                        index={index}
                      />
                    ))}
                  </div>
                )}
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

          <DeleteRollDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            deleteCount={selectedRolls.size}
            onDelete={handleConfirmDeleteRoll}
            isDeleting={deleteMutation.isPending}
          />

          {/* Batch Selection Bar */}
          {selectionMode && (
            <BatchSelectionBar
              selectedCount={selectedRolls.size}
              totalCount={filteredRolls.length}
              onSelectAll={handleSelectAllRolls}
              onDeselectAll={handleDeselectAllRolls}
              onClearSelection={handleClearRollSelection}
              onDelete={handleDeleteRolls}
              itemType="roll"
            />
          )}
        </>
      )}
    </div>
  );
}

// Default export with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-deep">
        <Loader2 className="w-8 h-8 animate-spin text-tertiary" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
