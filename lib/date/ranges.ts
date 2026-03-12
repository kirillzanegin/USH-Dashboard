import {
  subDays,
  parseISO,
  format,
  differenceInMinutes,
  differenceInDays,
} from 'date-fns';
import { DateRange, DatePreset } from '@/types';

/** Start of day in UTC (00:00:00.000 UTC for the given date's UTC date). */
function startOfDayUTC(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
}

/** End of day in UTC (23:59:59.999 UTC for the given date's UTC date). */
function endOfDayUTC(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
}

export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const now = new Date();

  switch (preset) {
    case 'today':
      return {
        from: startOfDayUTC(now),
        to: endOfDayUTC(now),
      };
    case '7days':
      return {
        from: startOfDayUTC(subDays(now, 6)),
        to: endOfDayUTC(now),
      };
    case '30days':
      return {
        from: startOfDayUTC(subDays(now, 29)),
        to: endOfDayUTC(now),
      };
    case 'all':
      return {
        from: new Date('2000-01-01T00:00:00.000Z'),
        to: endOfDayUTC(now),
      };
  }
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd.MM.yyyy');
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd.MM.yyyy HH:mm');
}

export function getMinutesBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return Math.abs(differenceInMinutes(d1, d2));
}

export function getDaysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return Math.abs(differenceInDays(d1, d2));
}
