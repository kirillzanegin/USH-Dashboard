import { DbSpin, DbUser } from '@/types';
import { NO_PRIZE_ID, WELCOME_PRIZE_ID, VALUABLE_PRIZE_IDS } from '@/config/prizes';
import { getMinutesBetween } from '@/lib/date/ranges';

export interface PlayerStats {
  user: DbUser;
  spinsInPeriod: number;
  totalSpins: number;
  wonPrizes: number;
  noPrizes: number;
  welcomePrizes: number;
  redeemedPrizes: number;
  expiredPrizes: number;
  valuablePrizes: number;
  lastActivity: string | null;
  avgInterval: number | null;
  activeDays: number;
}

export function computePlayerStats(
  user: DbUser,
  spinsInPeriod: DbSpin[],
  totalSpins: number
): PlayerStats {
  const now = new Date();

  const wonPrizes = spinsInPeriod.filter(
    (s) => s.prize_id !== WELCOME_PRIZE_ID && s.prize_id !== NO_PRIZE_ID
  ).length;
  const noPrizes = spinsInPeriod.filter(
    (s) => s.prize_id === NO_PRIZE_ID
  ).length;
  const welcomePrizes = spinsInPeriod.filter(
    (s) => s.prize_id === WELCOME_PRIZE_ID
  ).length;
  const redeemedPrizes = spinsInPeriod.filter((s) => s.used_at !== null).length;
  const expiredPrizes = spinsInPeriod.filter(
    (s) =>
      s.used_at === null &&
      s.valid_until !== null &&
      new Date(s.valid_until) < now
  ).length;
  const valuablePrizes = spinsInPeriod.filter((s) =>
    VALUABLE_PRIZE_IDS.includes(s.prize_id as (typeof VALUABLE_PRIZE_IDS)[number])
  ).length;

  const lastSpin = spinsInPeriod.length > 0
    ? spinsInPeriod.reduce((latest, s) =>
        s.created_at > latest ? s.created_at : latest
      , spinsInPeriod[0].created_at)
    : null;

  const activeDays = new Set(spinsInPeriod.map((s) => s.created_at.split('T')[0])).size;

  let avgInterval: number | null = null;
  const sorted = [...spinsInPeriod].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  if (sorted.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(getMinutesBetween(sorted[i - 1].created_at, sorted[i].created_at));
    }
    avgInterval = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  return {
    user,
    spinsInPeriod: spinsInPeriod.length,
    totalSpins,
    wonPrizes,
    noPrizes,
    welcomePrizes,
    redeemedPrizes,
    expiredPrizes,
    valuablePrizes,
    lastActivity: lastSpin,
    avgInterval,
    activeDays,
  };
}
