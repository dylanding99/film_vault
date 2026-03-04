'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FilmPreset } from '@/types/film-preset';
import { FilmPresetGrid } from '@/components/FilmPresetGrid';
import { FilmPresetForm } from '@/components/FilmPresetForm';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { getFilmPresets, createFilmPreset, updateFilmPreset, deleteFilmPreset } from '@/lib/db';
import { Plus, Search, Trash2, ArrowLeft, Filter, Loader2, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { NewFilmPreset, PresetFormData } from '@/types/film-preset';

type FilterFormat = 'all' | '120' | '135';

export default function PresetsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<FilterFormat>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<FilmPreset | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<FilmPreset | undefined>();

  // Fetch all presets
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['film-presets'],
    queryFn: getFilmPresets,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (preset: PresetFormData) => createFilmPreset(preset as NewFilmPreset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['film-presets'] });
      setIsFormOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, preset }: { id: number; preset: PresetFormData }) =>
      updateFilmPreset(id, preset as NewFilmPreset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['film-presets'] });
      setEditingPreset(undefined);
      setIsFormOpen(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFilmPreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['film-presets'] });
      setDeleteDialogOpen(false);
      setPresetToDelete(undefined);
    },
  });

  // Filter presets (Sorting and Grouping is handled by FilmPresetGrid)
  const filteredPresets = useMemo(() => {
    return presets
      .filter((preset) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          preset.name.toLowerCase().includes(query) ||
          preset.brand.toLowerCase().includes(query) ||
          preset.format.toLowerCase().includes(query);
        
        const matchesFormat = filterFormat === 'all' || preset.format === filterFormat;
        
        return matchesSearch && matchesFormat;
      });
  }, [presets, searchQuery, filterFormat]);

  const handleCreatePreset = async (data: PresetFormData) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdatePreset = async (data: PresetFormData) => {
    if (editingPreset) {
      await updateMutation.mutateAsync({ id: editingPreset.id, preset: data });
    }
  };

  const handleEdit = (preset: FilmPreset) => {
    setEditingPreset(preset);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (preset: FilmPreset) => {
    setPresetToDelete(preset);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (presetToDelete) {
      deleteMutation.mutate(presetToDelete.id);
    }
  };

  const openCreateForm = () => {
    setEditingPreset(undefined);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-8 h-8 animate-spin text-tertiary" />
        <div className="text-tertiary font-mono text-xs uppercase tracking-widest">Accessing Archive...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep text-white">
      {/* Shared Header */}
      <Header 
        onOpenImport={() => {}} // Not applicable on this page, but needed for component
        onOpenSettings={() => {}} // Placeholder
      />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Page Header */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="font-display text-4xl font-medium text-primary tracking-tight italic mb-2">
            Film Stock Presets
          </h1>
          <p className="text-secondary text-sm max-w-lg leading-relaxed">
            管理您的胶片类型预设，为档案录入提供快速的选择指引，保持元数据的一致性与专业度。
          </p>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar mb-12 animate-fade-in-up stagger-1">
          {/* Search */}
          <div className="search-wrapper">
            <div className="search-bar group">
              <input
                type="text"
                className="input"
                placeholder="搜索胶片名称、品牌或画幅..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="icon group-focus-within:text-color-brand" />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Format Pills */}
          <div className="filters-wrapper">
            <button
              className={`filter-pill ${filterFormat === 'all' ? 'active' : ''}`}
              onClick={() => setFilterFormat('all')}
            >
              全部画幅
            </button>
            <button
              className={`filter-pill ${filterFormat === '135' ? 'active' : 'opacity-70'}`}
              onClick={() => setFilterFormat('135')}
            >
              135 (35mm)
            </button>
            <button
              className={`filter-pill ${filterFormat === '120' ? 'active' : 'opacity-70'}`}
              onClick={() => setFilterFormat('120')}
            >
              120 (Medium)
            </button>
          </div>

          {/* Action */}
          <div className="ml-auto">
            <Button onClick={openCreateForm} className="btn-primary btn-lg shadow-glow gap-2 group">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
              <span>添加新预设</span>
            </Button>
          </div>
        </div>

        {/* Presets Grid */}
        <FilmPresetGrid
          presets={filteredPresets}
          showActions={true}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />

        {/* Stats */}
        {presets.length > 0 && (
          <div className="mt-16 flex items-center justify-between py-6 border-t border-subtle text-[10px] font-mono text-tertiary uppercase tracking-widest animate-fade-in">
            <div className="flex items-center gap-4">
              <span>Total Archive: {presets.length} Items</span>
              <span className="opacity-30">|</span>
              <span>Showing: {filteredPresets.length} Matching</span>
            </div>
            
            {(searchQuery || filterFormat !== 'all') && (
              <button 
                onClick={() => {setSearchQuery(''); setFilterFormat('all');}}
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <RotateCcw className="w-3 h-3 transition-transform group-hover:-rotate-180 duration-500" />
                <span>Reset View</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Form Dialog */}
      <FilmPresetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={editingPreset ? handleUpdatePreset : handleCreatePreset}
        preset={editingPreset}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-surface border-subtle">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">确认删除预设？</AlertDialogTitle>
            <AlertDialogDescription className="text-secondary text-sm">
              您确定要从胶卷预设库中移除 <span className="text-primary font-semibold">{presetToDelete?.name}</span> 吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="btn-secondary">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-accent-rose hover:bg-red-600 text-white border-none"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
