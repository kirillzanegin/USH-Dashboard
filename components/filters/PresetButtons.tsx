'use client';

import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/format';
import { LABELS } from '@/config/labels';
import { useFilters } from './FilterContext';
import type { DatePreset } from '@/types';

const presets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: LABELS.filters.today },
  { value: '7days', label: LABELS.filters.last7Days },
  { value: '30days', label: LABELS.filters.last30Days },
  { value: 'all', label: LABELS.filters.allTime },
];

export function PresetButtons() {
  const { setPreset, filterState } = useFilters();
  const searchParams = useSearchParams();

  const hasCustom = searchParams.has('from') && searchParams.has('to');

  const handlePreset = (preset: DatePreset) => {
    setPreset(preset);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => {
        const isActive =
          !hasCustom &&
          (filterState.preset === p.value ||
            (!searchParams.get('preset') && p.value === '7days'));
        return (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
