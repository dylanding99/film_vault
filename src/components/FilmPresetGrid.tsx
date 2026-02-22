import { FilmPreset } from '@/types/film-preset';
import { FilmPresetCard } from './FilmPresetCard';

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
  if (presets.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>暂无胶片预设</p>
        <p className="text-sm mt-1">点击"添加新预设"开始创建</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {presets.map((preset) => (
        <FilmPresetCard
          key={preset.id}
          preset={preset}
          selected={selectedPresetName === preset.name}
          onClick={selectable && onSelect ? () => onSelect(preset) : undefined}
          onEdit={showActions && onEdit ? () => onEdit(preset) : undefined}
          onDelete={showActions && onDelete ? () => onDelete(preset) : undefined}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
