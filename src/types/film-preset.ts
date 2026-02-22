export interface FilmPreset {
  id: number;
  name: string;
  format: string; // "120", "135", etc.
  brand_color: string; // Tailwind color class
  image_path?: string;
  brand: string;
  created_at: string;
}

export interface NewFilmPreset {
  name: string;
  format: string;
  brand_color: string;
  image_path?: string;
  brand: string;
}

export interface PresetFormData {
  name: string;
  format: string;
  brand_color: string;
  brand: string;
  imageFile?: File;
}

// Common film formats
export const FILM_FORMATS = [
  { value: '135', label: '135 (35mm)' },
  { value: '120', label: '120 (Medium Format)' },
  { value: 'other', label: '其他' },
];

// Common brand colors
export const BRAND_COLORS = [
  { value: 'bg-red-500', label: '红色', preview: '#ef4444' },
  { value: 'bg-orange-500', label: '橙色', preview: '#f97316' },
  { value: 'bg-amber-500', label: '琥珀色', preview: '#f59e0b' },
  { value: 'bg-yellow-500', label: '黄色', preview: '#eab308' },
  { value: 'bg-lime-500', label: '酸橙色', preview: '#84cc16' },
  { value: 'bg-green-500', label: '绿色', preview: '#22c55e' },
  { value: 'bg-teal-500', label: '青色', preview: '#14b8a6' },
  { value: 'bg-cyan-500', label: '蓝绿色', preview: '#06b6d4' },
  { value: 'bg-blue-500', label: '蓝色', preview: '#3b82f6' },
  { value: 'bg-indigo-500', label: '靛青色', preview: '#6366f1' },
  { value: 'bg-violet-500', label: '紫色', preview: '#8b5cf6' },
  { value: 'bg-purple-500', label: '紫红色', preview: '#a855f7' },
  { value: 'bg-fuchsia-500', label: '紫罗兰色', preview: '#d946ef' },
  { value: 'bg-pink-500', label: '粉红色', preview: '#ec4899' },
  { value: 'bg-rose-500', label: '玫瑰色', preview: '#f43f5e' },
  { value: 'bg-gray-500', label: '灰色', preview: '#6b7280' },
  { value: 'bg-zinc-500', label: '锌色', preview: '#71717a' },
  { value: 'bg-neutral-500', label: '中性色', preview: '#737373' },
  { value: 'bg-stone-500', label: '石色', preview: '#78716c' },
];

// Basic film stocks for fallback
export const BASIC_FILM_STOCKS = [
  'Kodak Portra 400',
  'Kodak Gold 200',
  'Fujifilm C200',
  'Fujifilm X-TRA 400',
  'Ilford HP5 Plus 400',
  'Ilford Delta 400',
  'CineStill 800T',
];
