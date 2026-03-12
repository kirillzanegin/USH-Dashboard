// Re-export DB types from Supabase layer
import type { DbUser, DbSpin, DbPrize } from '@/lib/supabase/types';
export type { DbUser, DbSpin, DbPrize };

// Enriched types for analytics
export interface SpinWithRelations extends DbSpin {
  user?: DbUser;
  prize?: DbPrize;
}

// Date range filter
export type DatePreset = 'today' | '7days' | '30days' | 'all';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface FilterState {
  preset: DatePreset;
  customRange: DateRange | null;
}

// Player analytics
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

// Prize analytics
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

// Anomaly detection
export interface Anomaly {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high';
  entityType: 'user' | 'prize' | 'system';
  entityId: number | null;
  entityName: string;
  explanation: string;
  metrics: Record<string, any>;
  detectedAt: Date;
}

// Overview metrics
export interface OverviewMetrics {
  totalUsers: number;
  activePlayers: number;
  totalSpins: number;
  wheelSpins: number;
  winningSpins: number;
  noWinSpins: number;
  welcomeGrants: number;
  redeemedPrizes: number;
  unusedActive: number;
  unusedExpired: number;
  winRate: number;
  noWinRate: number;
  avgSpinsPerPlayer: number;
  newPlayers: number;
  welcomePrizesUsed: number;
  avgIntervalMinutes: number | null;
  avgLifetimeDays: number | null;
}

// Chart data
export interface SpinsOverTimeData {
  date: string;
  count: number;
}

export interface ActivePlayersData {
  date: string;
  count: number;
}

export interface ResultDistributionData {
  name: string;
  value: number;
}

export interface TopPrizesData {
  name: string;
  count: number;
}

// Behavioral metrics
export interface BehaviorMetrics {
  avgGapMinutes: number | null;
  medianGapMinutes: number | null;
  avgDaysToFirstSpin: number | null;
  avgDaysToRedeem: number | null;
}

export interface ActivityHeatmapData {
  day: number;
  hour: number;
  count: number;
}

// Diagnostics
export interface DiagnosticCheck {
  name: string;
  passed: boolean;
  count: number;
  message: string;
}

export interface TableStats {
  tableName: string;
  rowCount: number;
  lastUpdated: string | null;
}
