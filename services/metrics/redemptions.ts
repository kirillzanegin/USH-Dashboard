import { DbSpin } from '@/types';

export interface RedemptionMetrics {
  totalGranted: number;
  redeemed: number;
  unusedActive: number;
  unusedExpired: number;
  redemptionRate: number;
  expirationRate: number;
}

export function computeRedemptionMetrics(spins: DbSpin[]): RedemptionMetrics {
  const now = new Date();
  const redeemed = spins.filter((s) => s.used_at !== null).length;
  const unusedActive = spins.filter(
    (s) =>
      s.used_at === null &&
      s.valid_until !== null &&
      new Date(s.valid_until) >= now
  ).length;
  const unusedExpired = spins.filter(
    (s) =>
      s.used_at === null &&
      s.valid_until !== null &&
      new Date(s.valid_until) < now
  ).length;
  const total = spins.length;
  const redemptionRate = total > 0 ? redeemed / total : 0;
  const expirationRate = total > 0 ? unusedExpired / total : 0;

  return {
    totalGranted: total,
    redeemed,
    unusedActive,
    unusedExpired,
    redemptionRate,
    expirationRate,
  };
}

export function groupByDate(
  spins: DbSpin[],
  fn: (s: DbSpin) => boolean,
  dateField: 'created_at' | 'used_at' | 'valid_until' = 'created_at'
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const s of spins) {
    if (fn(s)) {
      const val =
        dateField === 'created_at'
          ? s.created_at
          : dateField === 'used_at'
            ? s.used_at
            : s.valid_until;
      if (val) {
        const date = val.split('T')[0];
        result[date] = (result[date] ?? 0) + 1;
      }
    }
  }
  return result;
}
