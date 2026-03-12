import { getDateRangeFromPreset } from './ranges';
import type { DatePreset, DateRange } from '@/types';

export interface ParsedFilters {
  preset: DatePreset;
  range: DateRange;
  fromUrl: boolean;
}

/**
 * Parse URL search params into a DateRange.
 * Supports preset (today, 7days, 30days, all) or custom from/to.
 */
export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): ParsedFilters {
  const fromStr = typeof searchParams.from === 'string' ? searchParams.from : null;
  const toStr = typeof searchParams.to === 'string' ? searchParams.to : null;
  const presetStr = typeof searchParams.preset === 'string' ? searchParams.preset : null;
  const preset = (presetStr as DatePreset) ?? '7days';

  if (fromStr && toStr) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && from <= to) {
      const fromY = from.getUTCFullYear(), fromM = from.getUTCMonth(), fromD = from.getUTCDate();
      const toY = to.getUTCFullYear(), toM = to.getUTCMonth(), toD = to.getUTCDate();
      return {
        preset: '7days',
        range: {
          from: new Date(Date.UTC(fromY, fromM, fromD, 0, 0, 0, 0)),
          to: new Date(Date.UTC(toY, toM, toD, 23, 59, 59, 999)),
        },
        fromUrl: true,
      };
    }
  }

  const range = getDateRangeFromPreset(preset);
  return { preset, range, fromUrl: false };
}
