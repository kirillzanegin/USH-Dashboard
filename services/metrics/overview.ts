import { DbSpin, OverviewMetrics } from '@/types';
import { NO_PRIZE_ID, WELCOME_PRIZE_ID } from '@/config/prizes';
import { getMinutesBetween, getDaysBetween } from '@/lib/date/ranges';

/**
 * Calculate overview metrics from spins.
 * Caller must ensure spins are from non-admin users only.
 */
export function calculateOverviewMetrics(
  totalUsers: number,
  spinsInPeriod: DbSpin[],
  newPlayers: number
): OverviewMetrics {
  const validSpins = spinsInPeriod;

  const welcomeGrants = validSpins.filter(
    (s) => s.prize_id === WELCOME_PRIZE_ID
  ).length;

  const welcomePrizesUsed = validSpins.filter(
    (s) => s.prize_id === WELCOME_PRIZE_ID && s.used_at !== null
  ).length;

  const wheelSpins = validSpins.filter(
    (s) => s.prize_id !== WELCOME_PRIZE_ID
  );

  const winningSpins = wheelSpins.filter(
    (s) => s.prize_id !== NO_PRIZE_ID
  ).length;

  const noWinSpins = wheelSpins.filter(
    (s) => s.prize_id === NO_PRIZE_ID
  ).length;

  const redeemedPrizes = validSpins.filter(
    (s) => s.used_at !== null
  ).length;

  const now = new Date();
  const unusedActive = validSpins.filter(
    (s) =>
      s.used_at === null &&
      s.valid_until !== null &&
      new Date(s.valid_until) >= now
  ).length;

  const unusedExpired = validSpins.filter(
    (s) =>
      s.used_at === null &&
      s.valid_until !== null &&
      new Date(s.valid_until) < now
  ).length;

  const uniqueActivePlayers = new Set(validSpins.map((s) => s.user_id)).size;

  const winRate =
    wheelSpins.length > 0 ? winningSpins / wheelSpins.length : 0;
  const noWinRate = wheelSpins.length > 0 ? noWinSpins / wheelSpins.length : 0;

  const avgSpinsPerPlayer =
    uniqueActivePlayers > 0 ? validSpins.length / uniqueActivePlayers : 0;

  // Global average interval between spins (minutes), considering only wheel spins.
  const nonWelcomeSorted = validSpins
    .filter((s) => s.prize_id !== WELCOME_PRIZE_ID)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  const gaps: number[] = [];
  for (let i = 1; i < nonWelcomeSorted.length; i++) {
    gaps.push(
      getMinutesBetween(
        nonWelcomeSorted[i - 1].created_at,
        nonWelcomeSorted[i].created_at
      )
    );
  }
  const avgIntervalMinutes =
    gaps.length > 0
      ? gaps.reduce((sum, v) => sum + v, 0) / gaps.length
      : null;

  // "LTV" игрока: среднее число дней от второго до последнего вращения колеса.
  const byUser = new Map<number, DbSpin[]>();
  for (const s of nonWelcomeSorted) {
    const arr = byUser.get(s.user_id) ?? [];
    arr.push(s);
    byUser.set(s.user_id, arr);
  }
  const lifetimes: number[] = [];
  for (const [, spins] of byUser) {
    if (spins.length >= 2) {
      const second = spins[1];
      const last = spins[spins.length - 1]!;
      const days = getDaysBetween(second.created_at, last.created_at);
      lifetimes.push(days);
    }
  }
  const avgLifetimeDays =
    lifetimes.length > 0
      ? lifetimes.reduce((sum, v) => sum + v, 0) / lifetimes.length
      : null;

  return {
    totalUsers,
    activePlayers: uniqueActivePlayers,
    totalSpins: validSpins.length,
    wheelSpins: wheelSpins.length,
    winningSpins,
    noWinSpins,
    welcomeGrants,
    redeemedPrizes,
    unusedActive,
    unusedExpired,
    winRate,
    noWinRate,
    avgSpinsPerPlayer,
    newPlayers,
    welcomePrizesUsed,
    avgIntervalMinutes,
    avgLifetimeDays,
  };
}

export function groupSpinsByDate(
  spins: DbSpin[]
): Record<string, number> {
  const grouped: Record<string, number> = {};
  
  spins.forEach((spin) => {
    const date = spin.created_at.split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return grouped;
}

export function groupActivePlayersByDate(
  spins: DbSpin[]
): Record<string, number> {
  const grouped: Record<string, Set<number>> = {};

  spins.forEach((spin) => {
    const date = spin.created_at.split('T')[0];
    if (!grouped[date]) {
      grouped[date] = new Set();
    }
    grouped[date].add(spin.user_id);
  });

  const result: Record<string, number> = {};
  Object.entries(grouped).forEach(([date, userSet]) => {
    result[date] = userSet.size;
  });

  return result;
}

export interface ResultDistributionItem {
  name: string;
  value: number;
}

export function getResultDistribution(spins: DbSpin[]): ResultDistributionItem[] {
  const welcome = spins.filter((s) => s.prize_id === WELCOME_PRIZE_ID).length;
  const wheelSpins = spins.filter((s) => s.prize_id !== WELCOME_PRIZE_ID);
  const win = wheelSpins.filter((s) => s.prize_id !== NO_PRIZE_ID).length;
  const noWin = wheelSpins.filter((s) => s.prize_id === NO_PRIZE_ID).length;

  const items: ResultDistributionItem[] = [];
  if (win > 0) items.push({ name: 'Выигрыш', value: win });
  if (noWin > 0) items.push({ name: 'Ничего', value: noWin });
  if (welcome > 0) items.push({ name: 'Welcome', value: welcome });
  return items;
}

export interface TopPrizeItem {
  name: string;
  prizeId: number;
  count: number;
}

export function getTopPrizesByCount(
  spins: DbSpin[],
  prizeNames: Map<number, string>
): TopPrizeItem[] {
  const counts = new Map<number, number>();
  spins.forEach((s) => {
    if (s.prize_id !== WELCOME_PRIZE_ID) {
      counts.set(s.prize_id, (counts.get(s.prize_id) ?? 0) + 1);
    }
  });
  return Array.from(counts.entries())
    .map(([prizeId, count]) => ({
      name: prizeNames.get(prizeId) ?? `Приз #${prizeId}`,
      prizeId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function getTopPrizesByUsage(
  spins: DbSpin[],
  prizeNames: Map<number, string>
): TopPrizeItem[] {
  const redeemed = spins.filter((s) => s.used_at !== null);
  const counts = new Map<number, number>();
  redeemed.forEach((s) => {
    counts.set(s.prize_id, (counts.get(s.prize_id) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([prizeId, count]) => ({
      name: prizeNames.get(prizeId) ?? `Приз #${prizeId}`,
      prizeId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export interface TopPlayerItem {
  userId: number;
  userName: string;
  value: number;
}

export function getTopPlayersByRedemptions(
  spins: DbSpin[],
  userNameGetter: (userId: number) => string
): TopPlayerItem[] {
  const redeemed = spins.filter((s) => s.used_at !== null);
  const counts = new Map<number, number>();
  redeemed.forEach((s) => {
    counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([userId, value]) => ({ userId, userName: userNameGetter(userId), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function getTopPlayersBySpins(
  spins: DbSpin[],
  userNameGetter: (userId: number) => string
): TopPlayerItem[] {
  const counts = new Map<number, number>();
  spins.forEach((s) => {
    counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([userId, value]) => ({ userId, userName: userNameGetter(userId), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function getTopPlayersByValuablePrizes(
  spins: DbSpin[],
  userNameGetter: (userId: number) => string
): TopPlayerItem[] {
  const valuable = spins.filter((s) =>
    [1, 2, 5, 9].includes(s.prize_id)
  );
  const counts = new Map<number, number>();
  valuable.forEach((s) => {
    counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([userId, value]) => ({ userId, userName: userNameGetter(userId), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export interface FairnessSummary {
  totalWeight: number;
  wheelSpinsCount: number;
  maxDeviation: number;
}

export interface AnomalySummary {
  count: number;
  highSeverity: number;
}

