'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FilmPreset } from '@/types/film-preset';
import { FilmPresetGrid } from '@/components/FilmPresetGrid';
import { FilmPresetForm } from '@/components/FilmPresetForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFilmPresets, createFilmPreset, updateFilmPreset, deleteFilmPreset } from '@/lib/db';
import { Plus, Search, Trash2, ArrowLeft, Filter } from 'lucide-react';
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

type SortOption = 'name' | 'brand' | 'format';
type FilterFormat = 'all' | '120' | '135';

export default function PresetsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<FilterFormat>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilter, setShowFilter] = useState(false);
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

  // Filter and sort presets
  const filteredPresets = presets
    .filter((preset) => {
      const query = searchQuery.toLowerCase();
      return (
        preset.name.toLowerCase().includes(query) ||
        preset.brand.toLowerCase().includes(query) ||
        preset.format.toLowerCase().includes(query)
      );
    })
    .filter((preset) => {
      if (filterFormat === 'all') return true;
      return preset.format === filterFormat;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN');
        case 'brand':
          return a.brand.localeCompare(b.brand, 'zh-CN');
        case 'format':
          return a.format.localeCompare(b.format);
        default:
          return 0;
      }
    });

  const handleCreatePreset = (data: PresetFormData) => {
    return createMutation.mutateAsync(data);
  };

  const handleUpdatePreset = (data: PresetFormData) => {
    if (editingPreset) {
      return updateMutation.mutateAsync({ id: editingPreset.id, preset: data });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">胶片预设</h1>
          </div>
          <p className="text-zinc-400 ml-14">
            管理您的胶片类型预设，用于快速选择常用的胶片
          </p>
        </div>

        {/* Search, Filter and Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="搜索预设..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilter(!showFilter)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            筛选
          </Button>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="h-4 w-4" />
            添加新预设
          </Button>
        </div>

        {/* Filter Options */}
        {showFilter && (
          <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            {/* Format Filter */}
            <div className="mb-4">
              <div className="text-sm text-zinc-400 mb-2">画幅类型</div>
              <div className="flex gap-2">
                <Button
                  variant={filterFormat === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterFormat('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterFormat === '120' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterFormat('120')}
                >
                  120
                </Button>
                <Button
                  variant={filterFormat === '135' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterFormat('135')}
                >
                  135
                </Button>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <div className="text-sm text-zinc-400 mb-2">排序方式</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={sortBy === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('name')}
                >
                  按名称
                </Button>
                <Button
                  variant={sortBy === 'brand' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('brand')}
                >
                  按品牌
                </Button>
                <Button
                  variant={sortBy === 'format' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('format')}
                >
                  按画幅
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Presets Grid */}
        {filteredPresets.length > 0 ? (
          <FilmPresetGrid
            presets={filteredPresets}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
            <p className="text-zinc-400 mb-2">
              {searchQuery || filterFormat !== 'all'
                ? '未找到匹配的预设'
                : '暂无胶片预设'}
            </p>
            {!searchQuery && filterFormat === 'all' && (
              <Button onClick={openCreateForm} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                添加第一个预设
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        {presets.length > 0 && (
          <div className="mt-6 text-sm text-zinc-500">
            共 {presets.length} 个预设
            {filteredPresets.length !== presets.length && ` (显示 ${filteredPresets.length} 个)`}
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
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除预设？</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              您确定要删除预设 <span className="text-white font-semibold">{presetToDelete?.name}</span> 吗？
              <br />
              <br />
              注意：已有的胶卷引用将被保留，但不会显示为预设卡片。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
