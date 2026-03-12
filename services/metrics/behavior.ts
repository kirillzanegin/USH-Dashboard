import { DbSpin } from '@/types';
import { WELCOME_PRIZE_ID } from '@/config/prizes';
import { getMinutesBetween, getDaysBetween } from '@/lib/date/ranges';

export interface ActivityHeatmapCell {
  day: number;
  hour: number;
  count: number;
}

export function getActivityHeatmap(spins: DbSpin[]): ActivityHeatmapCell[] {
  const grid = new Map<string, number>();
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid.set(`${d}-${h}`, 0);
    }
  }
  for (const s of spins) {
    const date = new Date(s.created_at);
    const day = date.getUTCDay();
    const hour = date.getUTCHours();
    const key = `${day}-${hour}`;
    grid.set(key, (grid.get(key) ?? 0) + 1);
  }
  return Array.from(grid.entries()).map(([k, count]) => {
    const [d, h] = k.split('-').map(Number);
    return { day: d, hour: h, count };
  });
}

export function getGapsBetweenSpins(spins: DbSpin[]): number[] {
  const sorted = [...spins]
    .filter((s) => s.prize_id !== WELCOME_PRIZE_ID)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(getMinutesBetween(sorted[i - 1].created_at, sorted[i].created_at));
  }
  return gaps;
}

export function getMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function getDaysToFirstWheelSpin(
  spins: DbSpin[],
  userCreatedAt: string
): number | null {
  const wheelSpins = spins
    .filter((s) => s.prize_id !== WELCOME_PRIZE_ID)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (wheelSpins.length === 0) return null;
  return getDaysBetween(userCreatedAt, wheelSpins[0]!.created_at);
}

export function getDaysToRedeem(spins: DbSpin[]): number[] {
  const withRedeem = spins.filter(
    (s) => s.used_at !== null && s.prize_id !== WELCOME_PRIZE_ID
  );
  return withRedeem.map((s) =>
    getDaysBetween(s.created_at, s.used_at!)
  );
}
