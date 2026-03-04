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
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-[0.1em] uppercase shadow-sm border border-white/10
        ${displayColor} ${className}
      `}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
      <span className="text-white drop-shadow-sm">{displayText}</span>
    </div>
  );
}
