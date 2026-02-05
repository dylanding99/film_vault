export interface Roll {
  id: number;
  name: string;
  path: string;
  film_stock: string;
  camera: string;
  lens?: string;
  shoot_date: string;
  lab_info?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  roll_id: number;
  filename: string;
  file_path: string;
  thumbnail_path?: string;
  preview_path?: string;
  rating: number;
  is_cover: boolean;
  lat?: number;
  lon?: number;
  exif_synced: boolean;
  created_at: string;
}

export interface RollWithPhotos {
  roll: Roll;
  photos: Photo[];
  cover_photo?: Photo;
}

export interface ImportOptions {
  source_path: string;
  film_stock: string;
  camera: string;
  lens?: string;
  shoot_date: string;
  library_root: string;
  roll_name?: string;
  notes?: string;
}

export interface ImportResult {
  roll_id: number;
  photos_count: number;
  message: string;
}

export interface UpdateRollRequest {
  id: number;
  name: string;
  film_stock: string;
  camera: string;
  lens?: string;
  shoot_date: string;
  lab_info?: string;
  notes?: string;
}

// Film stock color mappings
export const FILM_STOCKS: Record<string, { color: string; text: string }> = {
  'Kodak Gold 200': { color: 'bg-yellow-500', text: 'GOLD 200' },
  'Kodak Portra 400': { color: 'bg-purple-600', text: 'PORTRA 400' },
  'Kodak Portra 800': { color: 'bg-purple-800', text: 'PORTRA 800' },
  'Kodak UltraMax 400': { color: 'bg-orange-500', text: 'ULTRAMAX 400' },
  'Kodak Ektar 100': { color: 'bg-pink-500', text: 'EKTAR 100' },
  'Kodak ColorPlus 200': { color: 'bg-yellow-600', text: 'COLORPLUS 200' },
  'Kodak Pro Image 100': { color: 'bg-amber-600', text: 'PRO IMAGE 100' },
  'Fujifilm C200': { color: 'bg-green-500', text: 'FUJI C200' },
  'Fujifilm 200': { color: 'bg-green-400', text: 'FUJI 200' },
  'Fujifilm X-TRA 400': { color: 'bg-green-600', text: 'X-TRA 400' },
  'Fujifilm Superia 400': { color: 'bg-emerald-600', text: 'SUPERIA 400' },
  'Fujifilm Velvia 100': { color: 'bg-red-500', text: 'VELVIA 100' },
  'Fujifilm Pro 400H': { color: 'bg-teal-600', text: 'PRO 400H' },
  'Fujifilm Natura 1600': { color: 'bg-blue-600', text: 'NATURA 1600' },
  'Ilford HP5 Plus 400': { color: 'bg-gray-600', text: 'HP5 PLUS 400' },
  'Ilford Delta 400': { color: 'bg-gray-500', text: 'DELTA 400' },
  'Ilford XP2 Super 400': { color: 'bg-slate-500', text: 'XP2 SUPER 400' },
  'Ilford Kentmere 400': { color: 'bg-stone-600', text: 'KENTMERE 400' },
  'CineStill 800T': { color: 'bg-red-700', text: '800T' },
  'CineStill 400D': { color: 'bg-red-600', text: '400D' },
  'Lomography Color 100': { color: 'bg-blue-400', text: 'LOMO 100' },
  'Lomography Metropolis 400': { color: 'bg-indigo-500', text: 'METROPOLIS 400' },
  'Unknown': { color: 'bg-gray-700', text: 'UNKNOWN' },
};
