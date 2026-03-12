export const ANOMALY_THRESHOLDS = {
  // Rule 1: Multiple spins per day
  maxSpinsPerDay: 1,

  // Rule 2: Too many valuable prizes
  valuablePrizeRateThreshold: 0.3, // 30% of spins resulting in valuable prizes is suspicious
  minSpinsForValuableCheck: 10,

  // Rule 3: Suspiciously high redemption count
  redemptionCountThreshold: 20,
  redemptionRateThreshold: 0.95, // 95%+ redemption rate is suspicious

  // Rule 4: Suspicious sequence of same prize
  sameSequenceLength: 3, // 3+ same prizes in a row

  // Rule 5: Prize distribution deviation
  distributionDeviationThreshold: 0.15, // 15 percentage points deviation from expected
  minWheelSpinsForFairness: 100,

  // Rule 6: High share of valuable prizes per user
  userValuableShareThreshold: 0.5, // 50%+ of user's wins being valuable
  minUserWinsForCheck: 5,

  // Rule 7: Unusual clustering of redemptions
  clusterTimeWindowMinutes: 5,
  clusterMinSize: 5,

  // Rule 8: Data inconsistency
  maxValidUntilFutureDays: 365,
  maxCreatedAtFutureDays: 1,
} as const;

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface AnomalyRule {
  id: string;
  name: string;
  description: string;
  severity: AnomalySeverity;
}

export const ANOMALY_RULES: AnomalyRule[] = [
  {
    id: 'multiple_spins_per_day',
    name: 'Несколько вращений за день',
    description: 'Пользователь сделал больше одного вращения за один UTC день',
    severity: 'high',
  },
  {
    id: 'too_many_valuable',
    name: 'Слишком много ценных призов',
    description: 'Пользователь выиграл аномально много ценных призов',
    severity: 'high',
  },
  {
    id: 'high_redemption',
    name: 'Подозрительно высокий redemption',
    description: 'Пользователь использовал подозрительно много призов',
    severity: 'medium',
  },
  {
    id: 'same_prize_sequence',
    name: 'Последовательность одинаковых призов',
    description: 'Пользователь выиграл один и тот же приз несколько раз подряд',
    severity: 'medium',
  },
  {
    id: 'distribution_deviation',
    name: 'Отклонение распределения призов',
    description: 'Фактическое распределение приза сильно отличается от ожидаемого',
    severity: 'medium',
  },
  {
    id: 'user_valuable_share',
    name: 'Высокая доля ценных призов у пользователя',
    description: 'У пользователя аномально высокая доля ценных призов среди выигрышей',
    severity: 'high',
  },
  {
    id: 'redemption_clustering',
    name: 'Кластеризация использований',
    description: 'Необычная концентрация использований призов в короткий период',
    severity: 'low',
  },
  {
    id: 'data_inconsistency',
    name: 'Несогласованность данных',
    description: 'Обнаружены потенциальные проблемы с целостностью данных',
    severity: 'medium',
  },
];
