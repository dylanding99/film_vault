/**
 * FilmVault Filter Utilities
 *
 * Utility functions for filtering rolls and photos
 * URL parameter sync for shareable filter links
 */

import { Roll } from './roll';
import type { RollFilters } from './filter';

/**
 * Filter rolls based on the provided filter criteria
 */
export function filterRolls(rolls: Roll[], filters: RollFilters): Roll[] {
  return rolls.filter((roll) => {
    // Text search (searches across name, camera, film stock, lens, notes)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const searchableText = [
        roll.name,
        roll.camera,
        roll.film_stock,
        roll.notes || '',
        roll.lens || '',
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(term)) {
        return false;
      }
    }

    // Film stock filter
    if (filters.filmStock !== 'all' && roll.film_stock !== filters.filmStock) {
      return false;
    }

    // Camera filter
    if (filters.camera !== 'all' && roll.camera !== filters.camera) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.from && roll.shoot_date < filters.dateRange.from) {
      return false;
    }
    if (filters.dateRange.to && roll.shoot_date > filters.dateRange.to) {
      return false;
    }

    // Favorites filter (only show rolls with favorited photos)
    if (filters.hasFavorites) {
      // Check if roll has favoriteCount property and it's > 0
      const rollWithCount = roll as Roll & { favoriteCount?: number };
      if (!rollWithCount.favoriteCount || rollWithCount.favoriteCount === 0) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get unique film stocks from a list of rolls
 */
export function getUniqueFilmStocks(rolls: Roll[]): string[] {
  const stocks = new Set(rolls.map((r) => r.film_stock));
  return Array.from(stocks).sort();
}

/**
 * Get unique cameras from a list of rolls
 */
export function getUniqueCameras(rolls: Roll[]): string[] {
  const cameras = new Set(rolls.map((r) => r.camera));
  return Array.from(cameras).sort();
}

// ==================== URL Parameter Sync ====================

/**
 * Convert filter state to URL search params
 */
export function filtersToSearchParams(filters: RollFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.searchTerm) {
    params.set('q', filters.searchTerm);
  }

  if (filters.filmStock !== 'all') {
    params.set('film_stock', filters.filmStock);
  }

  if (filters.camera !== 'all') {
    params.set('camera', filters.camera);
  }

  if (filters.dateRange.from) {
    params.set('date_from', filters.dateRange.from);
  }

  if (filters.dateRange.to) {
    params.set('date_to', filters.dateRange.to);
  }

  if (filters.hasFavorites) {
    params.set('favorites', '1');
  }

  return params;
}

/**
 * Parse URL search params to filter state
 */
export function searchParamsToFilters(params: URLSearchParams): Partial<RollFilters> {
  const filters: Partial<RollFilters> = {
    searchTerm: '',
    filmStock: 'all',
    camera: 'all',
    dateRange: { from: null, to: null },
    hasFavorites: false,
  };

  if (params.has('q')) {
    filters.searchTerm = params.get('q') || '';
  }

  if (params.has('film_stock')) {
    filters.filmStock = params.get('film_stock') || 'all';
  }

  if (params.has('camera')) {
    filters.camera = params.get('camera') || 'all';
  }

  if (params.has('date_from')) {
    filters.dateRange = { ...filters.dateRange!, from: params.get('date_from') || null };
  }

  if (params.has('date_to')) {
    filters.dateRange = { ...filters.dateRange!, to: params.get('date_to') || null };
  }

  if (params.has('favorites') && params.get('favorites') === '1') {
    filters.hasFavorites = true;
  }

  return filters;
}

/**
 * Get default filter state
 */
export function getDefaultFilters(): RollFilters {
  return {
    searchTerm: '',
    filmStock: 'all',
    camera: 'all',
    dateRange: { from: null, to: null },
    hasFavorites: false,
  };
}

/**
 * Check if filters have any active filters
 */
export function hasActiveFilters(filters: RollFilters): boolean {
  return !!(
    filters.searchTerm ||
    filters.filmStock !== 'all' ||
    filters.camera !== 'all' ||
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.hasFavorites
  );
}

