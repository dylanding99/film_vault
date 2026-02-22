import { FILM_STOCKS } from '@/types/roll';

interface FilmStripBadgeProps {
  filmStock: string;
  className?: string;
}

export function FilmStripBadge({ filmStock, className = '' }: FilmStripBadgeProps) {
  const filmStockInfo = FILM_STOCKS[filmStock];

  // If film stock is in the predefined list, use the predefined color and text
  // Otherwise, use the raw film stock name with a neutral color
  const displayText = filmStockInfo?.text || filmStock;
  const displayColor = filmStockInfo?.color || 'bg-gray-700';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 text-white text-xs font-bold tracking-wider uppercase ${displayColor} ${className}`}
    >
      <div className="w-2 h-2 rounded-full bg-white/30" />
      <span>{displayText}</span>
    </div>
  );
}
