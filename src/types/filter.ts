/**
 * FilmVault Filter Types
 *
 * Type definitions for search and filter functionality
 */

/**
 * Roll filters for the home page
 */
export interface RollFilters {
  /** Text search term (searches across name, camera, film stock, lens, notes) */
  searchTerm: string;

  /** Film stock filter ('all' shows all rolls) */
  filmStock: string | 'all';

  /** Camera filter ('all' shows all rolls) */
  camera: string | 'all';

  /** Date range filter */
  dateRange: {
    /** Start date in YYYY-MM-DD format */
    from: string | null;
    /** End date in YYYY-MM-DD format */
    to: string | null;
  };

  /** Only show rolls that have favorited photos */
  hasFavorites: boolean;
}
