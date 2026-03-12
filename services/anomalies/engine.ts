import { DbSpin, DbUser, DbPrize } from '@/types';
import { ANOMALY_THRESHOLDS, type AnomalySeverity } from '@/config/anomaly-thresholds';
import { VALUABLE_PRIZE_IDS, WELCOME_PRIZE_ID, NO_PRIZE_ID } from '@/config/prizes';
import { getTotalEligibleWeight } from '@/services/metrics/fairness';

export interface AnomalyResult {
  id: string;
  ruleId: string;
  severity: AnomalySeverity;
  entityType: 'user' | 'prize' | 'system';
  entityId: number | null;
  entityName: string;
  explanation: string;
  metrics: Record<string, unknown>;
}

function spinsByUserDay(spins: DbSpin[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of spins) {
    // For "multiple spins per day" we only consider wheel spins,
    // welcome spins are ignored and do not count as a separate rotation.
    if (s.prize_id === WELCOME_PRIZE_ID) continue;
    const date = s.created_at.split('T')[0];
    const key = `${s.user_id}-${date}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function checkMultipleSpinsPerDay(
  spins: DbSpin[],
  userName: (id: number) => string
): AnomalyResult[] {
  const byUserDay = spinsByUserDay(spins);
  const results: AnomalyResult[] = [];
  for (const [key, count] of byUserDay) {
    if (count > ANOMALY_THRESHOLDS.maxSpinsPerDay) {
      const [userIdStr] = key.split('-');
      const userId = parseInt(userIdStr!, 10);
      results.push({
        id: `multi-${key}`,
        ruleId: 'multiple_spins_per_day',
        severity: 'high',
        entityType: 'user',
        entityId: userId,
        entityName: userName(userId),
        explanation: `Пользователь сделал ${count} вращений за один UTC день (максимум: ${ANOMALY_THRESHOLDS.maxSpinsPerDay})`,
        metrics: { spinsThatDay: count, maxAllowed: ANOMALY_THRESHOLDS.maxSpinsPerDay },
      });
    }
  }
  return results;
}

function checkTooManyValuable(
  spins: DbSpin[],
  userName: (id: number) => string
): AnomalyResult[] {
  const byUser = new Map<number, { total: number; valuable: number }>();
  for (const s of spins) {
    if (s.prize_id === WELCOME_PRIZE_ID) continue;
    const entry = byUser.get(s.user_id) ?? { total: 0, valuable: 0 };
    entry.total++;
    if (VALUABLE_PRIZE_IDS.includes(s.prize_id as (typeof VALUABLE_PRIZE_IDS)[number])) {
      entry.valuable++;
    }
    byUser.set(s.user_id, entry);
  }
  const results: AnomalyResult[] = [];
  for (const [userId, { total, valuable }] of byUser) {
    if (
      total >= ANOMALY_THRESHOLDS.minSpinsForValuableCheck &&
      valuable / total > ANOMALY_THRESHOLDS.valuablePrizeRateThreshold
    ) {
      results.push({
        id: `valuable-${userId}`,
        ruleId: 'too_many_valuable',
        severity: 'high',
        entityType: 'user',
        entityId: userId,
        entityName: userName(userId),
        explanation: `Доля ценных призов: ${(valuable / total * 100).toFixed(1)}% (порог: ${ANOMALY_THRESHOLDS.valuablePrizeRateThreshold * 100}%)`,
        metrics: { valuable, total, rate: valuable / total },
      });
    }
  }
  return results;
}

function checkHighRedemption(
  spins: DbSpin[],
  userName: (id: number) => string
): AnomalyResult[] {
  const byUser = new Map<number, { total: number; redeemed: number }>();
  for (const s of spins) {
    if (s.prize_id === NO_PRIZE_ID || s.prize_id === WELCOME_PRIZE_ID) continue;
    const entry = byUser.get(s.user_id) ?? { total: 0, redeemed: 0 };
    entry.total++;
    if (s.used_at !== null) entry.redeemed++;
    byUser.set(s.user_id, entry);
  }
  const results: AnomalyResult[] = [];
  for (const [userId, { total, redeemed }] of byUser) {
    if (
      redeemed >= ANOMALY_THRESHOLDS.redemptionCountThreshold ||
      (total >= 5 && redeemed / total >= ANOMALY_THRESHOLDS.redemptionRateThreshold)
    ) {
      results.push({
        id: `redeem-${userId}`,
        ruleId: 'high_redemption',
        severity: 'medium',
        entityType: 'user',
        entityId: userId,
        entityName: userName(userId),
        explanation: `Использовано призов: ${redeemed} из ${total} (${(redeemed / total * 100).toFixed(0)}%)`,
        metrics: { redeemed, total, rate: redeemed / total },
      });
    }
  }
  return results;
}

function checkSamePrizeSequence(
  spins: DbSpin[],
  userName: (id: number) => string
): AnomalyResult[] {
  const byUser = new Map<number, DbSpin[]>();
  for (const s of spins) {
    if (s.prize_id === WELCOME_PRIZE_ID) continue;
    const arr = byUser.get(s.user_id) ?? [];
    arr.push(s);
    byUser.set(s.user_id, arr);
  }
  const results: AnomalyResult[] = [];
  const len = ANOMALY_THRESHOLDS.sameSequenceLength;
  for (const [userId, userSpins] of byUser) {
    const sorted = [...userSpins].sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (let i = 0; i <= sorted.length - len; i++) {
      const slice = sorted.slice(i, i + len);
      if (slice.every((s) => s.prize_id === slice[0]!.prize_id)) {
        results.push({
          id: `seq-${userId}-${i}`,
          ruleId: 'same_prize_sequence',
          severity: 'medium',
          entityType: 'user',
          entityId: userId,
          entityName: userName(userId),
          explanation: `Выиграл приз #${slice[0]!.prize_id} ${len} раз подряд`,
          metrics: { prizeId: slice[0]!.prize_id, count: len },
        });
        break;
      }
    }
  }
  return results;
}

function checkDistributionDeviation(
  spins: DbSpin[],
  prizes: DbPrize[]
): AnomalyResult[] {
  const wheelSpins = spins.filter((s) => s.prize_id !== WELCOME_PRIZE_ID);
  if (wheelSpins.length < ANOMALY_THRESHOLDS.minWheelSpinsForFairness) return [];

  const totalWeight = getTotalEligibleWeight(prizes);
  if (totalWeight <= 0) return [];

  const counts = new Map<number, number>();
  for (const s of wheelSpins) {
    counts.set(s.prize_id, (counts.get(s.prize_id) ?? 0) + 1);
  }

  const results: AnomalyResult[] = [];
  for (const p of prizes) {
    if (p.id === WELCOME_PRIZE_ID || !p.is_active || (p.weight ?? 0) <= 0) continue;
    const expected = (p.weight ?? 0) / totalWeight;
    const actual = (counts.get(p.id) ?? 0) / wheelSpins.length;
    const deviation = Math.abs(actual - expected);
    if (deviation >= ANOMALY_THRESHOLDS.distributionDeviationThreshold) {
      results.push({
        id: `fairness-${p.id}`,
        ruleId: 'distribution_deviation',
        severity: 'medium',
        entityType: 'prize',
        entityId: p.id,
        entityName: p.name ?? `Приз #${p.id}`,
        explanation: `Отклонение: ${(deviation * 100).toFixed(1)} п.п. (ожид. ${(expected * 100).toFixed(1)}%, факт. ${(actual * 100).toFixed(1)}%)`,
        metrics: { expected, actual, deviation },
      });
    }
  }
  return results;
}

function checkUserValuableShare(
  spins: DbSpin[],
  userName: (id: number) => string
): AnomalyResult[] {
  const byUser = new Map<number, { wins: number; valuable: number }>();
  for (const s of spins) {
    if (s.prize_id === WELCOME_PRIZE_ID || s.prize_id === NO_PRIZE_ID) continue;
    const entry = byUser.get(s.user_id) ?? { wins: 0, valuable: 0 };
    entry.wins++;
    if (VALUABLE_PRIZE_IDS.includes(s.prize_id as (typeof VALUABLE_PRIZE_IDS)[number])) {
      entry.valuable++;
    }
    byUser.set(s.user_id, entry);
  }
  const results: AnomalyResult[] = [];
  for (const [userId, { wins, valuable }] of byUser) {
    if (
      wins >= ANOMALY_THRESHOLDS.minUserWinsForCheck &&
      valuable / wins >= ANOMALY_THRESHOLDS.userValuableShareThreshold
    ) {
      results.push({
        id: `share-${userId}`,
        ruleId: 'user_valuable_share',
        severity: 'high',
        entityType: 'user',
        entityId: userId,
        entityName: userName(userId),
        explanation: `Доля ценных призов среди выигрышей: ${(valuable / wins * 100).toFixed(0)}%`,
        metrics: { valuable, wins, share: valuable / wins },
      });
    }
  }
  return results;
}

function checkDataInconsistency(spins: DbSpin[]): AnomalyResult[] {
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
  const results: AnomalyResult[] = [];

  const futureSpins = spins.filter(
    (s) => s.created_at.split('T')[0] > todayDate
  );
  if (futureSpins.length > 0) {
    const sample = futureSpins
      .slice(0, 5)
      .map((s) => `#${s.id} @ ${s.created_at}`)
      .join(', ');
    results.push({
      id: 'future-created',
      ruleId: 'data_inconsistency',
      severity: 'medium',
      entityType: 'system',
      entityId: null,
      entityName: 'Система',
      explanation: `Найдено ${futureSpins.length} вращений с датой создания в будущем. Примеры: ${sample}`,
      metrics: {
        count: futureSpins.length,
        sample: futureSpins.slice(0, 10).map((s) => ({
          id: s.id,
          created_at: s.created_at,
        })),
      },
    });
  }

  const farFutureValid = spins.filter((s) => {
    if (!s.valid_until) return false;
    const diff = (new Date(s.valid_until).getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    return diff > ANOMALY_THRESHOLDS.maxValidUntilFutureDays;
  }).length;
  if (farFutureValid > 0) {
    results.push({
      id: 'far-valid',
      ruleId: 'data_inconsistency',
      severity: 'low',
      entityType: 'system',
      entityId: null,
      entityName: 'Система',
      explanation: `${farFutureValid} призов с valid_until более чем через ${ANOMALY_THRESHOLDS.maxValidUntilFutureDays} дней`,
      metrics: { count: farFutureValid },
    });
  }

  return results;
}

export function runAnomalyDetection(
  spins: DbSpin[],
  users: DbUser[],
  prizes: DbPrize[],
  userNameGetter: (id: number) => string
): AnomalyResult[] {
  const results: AnomalyResult[] = [];

  results.push(...checkMultipleSpinsPerDay(spins, userNameGetter));
  results.push(...checkTooManyValuable(spins, userNameGetter));
  results.push(...checkHighRedemption(spins, userNameGetter));
  results.push(...checkSamePrizeSequence(spins, userNameGetter));
  results.push(...checkDistributionDeviation(spins, prizes));
  results.push(...checkUserValuableShare(spins, userNameGetter));
  results.push(...checkDataInconsistency(spins));

  return results;
}
