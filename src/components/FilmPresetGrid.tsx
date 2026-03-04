import { FilmPreset } from '@/types/film-preset';
import { FilmPresetCard } from './FilmPresetCard';
import { useMemo } from 'react';

interface FilmPresetGridProps {
  presets: FilmPreset[];
  selectedPresetName?: string;
  onSelect?: (preset: FilmPreset) => void;
  selectable?: boolean;
  showActions?: boolean;
  onEdit?: (preset: FilmPreset) => void;
  onDelete?: (preset: FilmPreset) => void;
}

export function FilmPresetGrid({
  presets,
  selectedPresetName,
  onSelect,
  selectable = false,
  showActions = false,
  onEdit,
  onDelete,
}: FilmPresetGridProps) {
  // Group and sort presets
  const groupedPresets = useMemo(() => {
    // 1. Sort by brand then name
    const sorted = [...presets].sort((a, b) => {
      const brandCompare = a.brand.localeCompare(b.brand, 'zh-CN');
      if (brandCompare !== 0) return brandCompare;
      return a.name.localeCompare(b.name, 'zh-CN');
    });

    // 2. Group by format
    const groups: Record<string, FilmPreset[]> = {};
    sorted.forEach(preset => {
      const format = preset.format || 'Other';
      if (!groups[format]) groups[format] = [];
      groups[format].push(preset);
    });

    // 3. Convert to array and sort format (135 before 120 usually, or numeric)
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [presets]);

  if (presets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-surface border border-subtle flex items-center justify-center mb-4">
          <span className="text-2xl opacity-20">🎞️</span>
        </div>
        <h3 className="text-secondary font-medium">暂无胶片预设</h3>
        <p className="text-tertiary text-xs mt-1">点击"添加新预设"开始创建您的胶片库</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {groupedPresets.map(([format, formatPresets], groupIndex) => (
        <div 
          key={format} 
          className="animate-fade-in-up" 
          style={{ animationDelay: `${groupIndex * 150}ms` }}
        >
          {/* Format Header */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-display text-2xl font-medium text-primary tracking-tight italic">
              Format {format}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-subtle to-transparent" />
            <div className="font-mono text-[10px] text-tertiary uppercase tracking-widest">
              {formatPresets.length} Presets
            </div>
          </div>

          {/* Smaller, tighter grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {formatPresets.map((preset, index) => (
              <div 
                key={preset.id} 
                className="animate-fade-in-up" 
                style={{ animationDelay: `${(groupIndex * 150) + (index * 40)}ms` }}
              >
                <FilmPresetCard
                  preset={preset}
                  selected={selectedPresetName === preset.name}
                  onClick={selectable && onSelect ? () => onSelect(preset) : undefined}
                  onEdit={showActions && onEdit ? () => onEdit(preset) : undefined}
                  onDelete={showActions && onDelete ? () => onDelete(preset) : undefined}
                  showActions={showActions}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
