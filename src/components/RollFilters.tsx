/**
 * FilmVault RollFilters Component
 *
 * Search and filter UI for the roll list
 */

'use client';

import { useState } from 'react';
import { Search, X, Filter, Calendar, Camera } from 'lucide-react';
import type { RollFilters } from '@/types/filter';
import { getUniqueFilmStocks, getUniqueCameras } from '@/lib/filter-utils';
import { Roll } from '@/types/roll';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface RollFiltersProps {
  rolls: Roll[];
  filters: RollFilters;
  onFiltersChange: (filters: RollFilters) => void;
  filteredCount: number;
  totalCount: number;
}

export function RollFilters({
  rolls,
  filters,
  onFiltersChange,
  filteredCount,
  totalCount,
}: RollFiltersProps) {
  // Get unique values for dropdowns
  const filmStocks = getUniqueFilmStocks(rolls);
  const cameras = getUniqueCameras(rolls);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm !== '' ||
    filters.filmStock !== 'all' ||
    filters.camera !== 'all' ||
    filters.dateRange.from !== null ||
    filters.dateRange.to !== null ||
    filters.hasFavorites;

  // Clear all filters
  const handleClearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      filmStock: 'all',
      camera: 'all',
      dateRange: { from: null, to: null },
      hasFavorites: false,
    });
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Search and Clear Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="搜索胶卷名称、相机、胶片类型..."
            value={filters.searchTerm}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchTerm: e.target.value })
            }
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4 mr-1" />
            清除筛选
          </Button>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Film Stock Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <Label htmlFor="filmStock" className="text-sm text-zinc-400">
            胶片类型:
          </Label>
          <select
            id="filmStock"
            value={filters.filmStock}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                filmStock: e.target.value as string | 'all',
              })
            }
            className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <option value="all">全部</option>
            {filmStocks.map((stock) => (
              <option key={stock} value={stock}>
                {stock}
              </option>
            ))}
          </select>
        </div>

        {/* Camera Filter */}
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-zinc-500" />
          <Label htmlFor="camera" className="text-sm text-zinc-400">
            相机:
          </Label>
          <select
            id="camera"
            value={filters.camera}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                camera: e.target.value as string | 'all',
              })
            }
            className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <option value="all">全部</option>
            {cameras.map((camera) => (
              <option key={camera} value={camera}>
                {camera}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <Label className="text-sm text-zinc-400">日期:</Label>
          <Input
            type="date"
            value={filters.dateRange.from || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, from: e.target.value || null },
              })
            }
            className="w-36 bg-zinc-900 border-zinc-700 text-zinc-100 text-sm"
          />
          <span className="text-zinc-500">-</span>
          <Input
            type="date"
            value={filters.dateRange.to || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, to: e.target.value || null },
              })
            }
            className="w-36 bg-zinc-900 border-zinc-700 text-zinc-100 text-sm"
          />
        </div>

        {/* Favorites Filter */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasFavorites}
            onChange={(e) =>
              onFiltersChange({ ...filters, hasFavorites: e.target.checked })
            }
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          />
          <span className="text-sm text-zinc-300">只看收藏</span>
        </label>
      </div>

      {/* Result Count */}
      <div className="text-sm text-zinc-400">
        {filteredCount === totalCount ? (
          <span>共 {totalCount} 个胶卷</span>
        ) : (
          <span>
            找到 <span className="text-zinc-100 font-medium">{filteredCount}</span> 个胶卷
            （共 {totalCount} 个）
          </span>
        )}
      </div>
    </div>
  );
}
