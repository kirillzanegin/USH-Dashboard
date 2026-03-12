import { DbPrize, DbSpin } from '@/types';
import { WELCOME_PRIZE_ID, VALUABLE_PRIZE_IDS } from '@/config/prizes';

export interface PrizeStats {
  prize: DbPrize;
  isWelcome: boolean;
  isValuable: boolean;
  expectedProb: number | null;
  actualProb: number | null;
  deviation: number | null;
  grantedInPeriod: number;
  grantedTotal: number;
  redeemed: number;
  unusedActive: number;
  unusedExpired: number;
  redemptionRate: number;
}

export function computePrizeStats(
  prize: DbPrize,
  wheelSpinsInPeriod: DbSpin[],
  allWheelSpins: DbSpin[],
  totalWheelSpinsInPeriod: number,
  totalWeight: number,
  spinsForPrizeInPeriod: DbSpin[],
  allSpinsForPrize: DbSpin[]
): PrizeStats {
  const now = new Date();
  const isWelcome = prize.id === WELCOME_PRIZE_ID;
  const isValuable = VALUABLE_PRIZE_IDS.includes(
    prize.id as (typeof VALUABLE_PRIZE_IDS)[number]
  );

  const weight = prize.weight ?? 0;
  const expectedProb =
    totalWeight > 0 && weight > 0 ? weight / totalWeight : null;
  const actualProb =
    totalWheelSpinsInPeriod > 0
      ? spinsForPrizeInPeriod.length / totalWheelSpinsInPeriod
      : null;
  const deviation =
    expectedProb !== null && actualProb !== null
      ? actualProb - expectedProb
      : null;

  const redeemed = spinsForPrizeInPeriod.filter((s) => s.used_at !== null).length;
  const unusedActive = spinsForPrizeInPeriod.filter(
    (s) =>
      s.used_at === null &&
      s.valid_until !== null &&
      new Date(s.valid_until) >= now
  ).length;
  const unusedExpired = spinsForPrizeInPeriod.filter(
    (s) =>
      s.used_at === null &&
      s.valid_until !== null &&
      new Date(s.valid_until) < now
  ).length;

  const total = spinsForPrizeInPeriod.length;
  const redemptionRate = total > 0 ? redeemed / total : 0;

  return {
    prize,
    isWelcome,
    isValuable,
    expectedProb,
    actualProb,
    deviation,
    grantedInPeriod: spinsForPrizeInPeriod.length,
    grantedTotal: allSpinsForPrize.length,
    redeemed,
    unusedActive,
    unusedExpired,
    redemptionRate,
  };
}
