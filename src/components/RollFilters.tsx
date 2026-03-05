/**
 * FilmVault RollFilters Component
 *
 * Modern horizontal filter bar with pill-style filters
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, Calendar, Camera, Star, ChevronDown, RotateCcw } from 'lucide-react';
import type { RollFilters } from '@/types/filter';
import { getUniqueFilmStocks, getUniqueCameras } from '@/lib/filter-utils';
import { Roll } from '@/types/roll';

interface RollFiltersProps {
  rolls: Roll[];
  filters: RollFilters;
  onFiltersChange: (filters: RollFilters) => void;
}

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  currentValue: string | null;
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
  active: boolean;
}

function FilterDropdown({
  label,
  icon,
  currentValue,
  options,
  placeholder,
  onSelect,
  active,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add "全部" as first option
  const allOptions = ['全部', ...options];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`filter-pill ${active ? 'active' : ''}`}
      >
        <span className="icon">{icon}</span>
        <span>{currentValue || placeholder}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="dropdown-menu open">
          {allOptions.map((option) => (
            <div
              key={option}
              onClick={() => {
                const value = option === '全部' ? 'all' : option;
                onSelect(value);
                setIsOpen(false);
              }}
              className={`item ${(currentValue === null && option === '全部') || currentValue === option ? 'active' : ''}`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateFilterDropdown({
  filters,
  onFiltersChange,
}: {
  filters: RollFilters;
  onFiltersChange: (f: RollFilters) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(filters.dateRange.from || '');
  const [localTo, setLocalTo] = useState(filters.dateRange.to || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const active = filters.dateRange.from !== null || filters.dateRange.to !== null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local state when filters reset externally
  useEffect(() => {
    setLocalFrom(filters.dateRange.from || '');
    setLocalTo(filters.dateRange.to || '');
  }, [filters.dateRange.from, filters.dateRange.to]);

  const handleApply = () => {
    onFiltersChange({
      ...filters,
      dateRange: { from: localFrom || null, to: localTo || null },
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalFrom('');
    setLocalTo('');
    onFiltersChange({ ...filters, dateRange: { from: null, to: null } });
    setIsOpen(false);
  };

  const label = filters.dateRange.from || filters.dateRange.to
    ? `${filters.dateRange.from || '…'} → ${filters.dateRange.to || '…'}`
    : '日期范围';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`filter-pill ${active ? 'active' : ''}`}
      >
        <span className="icon"><Calendar className="h-3.5 w-3.5" /></span>
        <span>{label}</span>
        {active ? (
          <X className="h-3 w-3 ml-1 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleClear(); }} />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu open p-3 min-w-[220px]">
          <div className="space-y-2 mb-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-tertiary font-mono mb-1 block">开始日期</label>
              <input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-primary focus:outline-none focus:border-color-brand/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-tertiary font-mono mb-1 block">结束日期</label>
              <input
                type="date"
                value={localTo}
                onChange={(e) => setLocalTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-primary focus:outline-none focus:border-color-brand/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 px-2 py-1.5 text-xs rounded-md border border-white/10 text-secondary hover:bg-white/5 transition-colors"
            >
              清除
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-2 py-1.5 text-xs rounded-md bg-color-brand/20 border border-color-brand/30 text-color-brand hover:bg-color-brand/30 transition-colors"
            >
              应用
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RollFilters({
  rolls,
  filters,
  onFiltersChange,
}: RollFiltersProps) {
  const filmStocks = getUniqueFilmStocks(rolls);
  const cameras = getUniqueCameras(rolls);
  const [searchValue, setSearchValue] = useState(filters.searchTerm);

  // Check if date filter is active
  const dateFilterActive =
    filters.dateRange.from !== null || filters.dateRange.to !== null;

  // Check if any filter is active
  const hasActiveFilters =
    filters.searchTerm !== '' ||
    filters.filmStock !== 'all' ||
    filters.camera !== 'all' ||
    dateFilterActive ||
    filters.hasFavorites;

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, searchTerm: searchValue });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Reset all filters
  const handleResetAll = () => {
    setSearchValue('');
    onFiltersChange({
      searchTerm: '',
      filmStock: 'all',
      camera: 'all',
      dateRange: { from: null, to: null },
      hasFavorites: false,
    });
  };

  return (
    <div className="filter-bar animate-fade-in-up">
      {/* Search Bar Wrapper */}
      <div className="search-wrapper">
        <div className="search-bar group">
          <input
            type="text"
            className="input"
            placeholder="搜索胶卷、相机、胶片..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <Search className="icon group-focus-within:text-color-brand transition-colors" />
          {searchValue && (
            <button
              className="clear-btn"
              onClick={() => setSearchValue('')}
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills Wrapper */}
      <div className="filters-wrapper">
        <FilterDropdown
          label="胶片类型"
          icon={<Filter className="h-3.5 w-3.5" />}
          currentValue={filters.filmStock === 'all' ? null : filters.filmStock}
          options={filmStocks}
          placeholder="胶片型号"
          onSelect={(value) => onFiltersChange({ ...filters, filmStock: value })}
          active={filters.filmStock !== 'all'}
        />

        <FilterDropdown
          label="相机"
          icon={<Camera className="h-3.5 w-3.5" />}
          currentValue={filters.camera === 'all' ? null : filters.camera}
          options={cameras}
          placeholder="相机型号"
          onSelect={(value) => onFiltersChange({ ...filters, camera: value })}
          active={filters.camera !== 'all'}
        />

        <DateFilterDropdown filters={filters} onFiltersChange={onFiltersChange} />

        <button
          className={`filter-pill ${filters.hasFavorites ? 'active' : 'opacity-70'}`}
          onClick={() => onFiltersChange({ ...filters, hasFavorites: !filters.hasFavorites })}
        >
          <span className="icon"><Star className={`h-3.5 w-3.5 ${filters.hasFavorites ? 'fill-current' : ''}`} /></span>
          <span>收藏夹</span>
        </button>
      </div>

      {/* Reset All Button (Right Side) */}
      {hasActiveFilters && (
        <div className="results-count">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors text-tertiary hover:text-secondary group"
            onClick={handleResetAll}
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:-rotate-180 duration-500" />
            <span className="font-mono text-[10px] uppercase tracking-widest">清除筛选</span>
          </button>
        </div>
      )}
    </div>
  );
}
