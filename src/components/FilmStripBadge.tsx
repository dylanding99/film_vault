import { FILM_STOCKS } from '@/types/roll';

interface FilmStripBadgeProps {
  filmStock: string;
  className?: string;
}

export function FilmStripBadge({ filmStock, className = '' }: FilmStripBadgeProps) {
  const filmStockInfo = FILM_STOCKS[filmStock] || FILM_STOCKS['Unknown'];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 text-white text-xs font-bold tracking-wider uppercase ${filmStockInfo.color} ${className}`}
    >
      <div className="w-2 h-2 rounded-full bg-white/30" />
      <span>{filmStockInfo.text}</span>
    </div>
  );
}
