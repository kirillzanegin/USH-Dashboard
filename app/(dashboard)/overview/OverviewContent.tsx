'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/components/filters/FilterContext';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpinsOverTimeChart } from '@/components/charts/SpinsOverTimeChart';
import { ActivePlayersChart } from '@/components/charts/ActivePlayersChart';
import { PrizeDistributionChart } from '@/components/charts/PrizeDistributionChart';
import { TopPrizesBarChart } from '@/components/charts/TopPrizesBarChart';
import { LABELS } from '@/config/labels';
import { OverviewMetrics } from '@/types';
import { formatDuration } from '@/lib/utils/format';

interface OverviewApiResponse {
  metrics: OverviewMetrics;
  charts: {
    spinsByDate: { date: string; count: number }[];
    activePlayersByDate: { date: string; count: number }[];
    resultDistribution: { name: string; value: number }[];
    topPrizesByCount: { name: string; prizeId: number; count: number }[];
    topPrizesByUsage: { name: string; prizeId: number; count: number }[];
  };
  summaries: {
    topPlayerByRedemptions: { userId: number; userName: string; value: number }[];
    topPlayerBySpins: { userId: number; userName: string; value: number }[];
    topPlayerByValuable: { userId: number; userName: string; value: number }[];
    fairness: { totalWeight: number; wheelSpinsCount: number; maxDeviation: number };
    anomalies: { count: number; highSeverity: number };
  };
}

export function OverviewContent() {
  const { dateRange } = useFilters();
  const [data, setData] = useState<OverviewApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const fromISO = dateRange.from.toISOString();
        const toISO = dateRange.to.toISOString();
        const url = `/api/overview?from=${fromISO}&to=${toISO}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const respData = await response.json();
        setData(respData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">{LABELS.common.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-destructive">
          {LABELS.common.error}: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">{LABELS.common.noData}</div>
      </div>
    );
  }

  const { metrics, charts, summaries } = data;

  const avgIntervalDisplay =
    metrics.avgIntervalMinutes != null
      ? formatDuration(metrics.avgIntervalMinutes)
      : '—';

  const avgLifetimeDisplay =
    metrics.avgLifetimeDays != null
      ? `${metrics.avgLifetimeDays.toFixed(1)} д`
      : '—';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KPICard title={LABELS.overview.totalUsers} value={metrics.totalUsers} />
        <KPICard
          title={LABELS.overview.activePlayers}
          value={metrics.activePlayers}
        />
        <KPICard title={LABELS.overview.totalSpins} value={metrics.totalSpins} />
        <KPICard
          title={LABELS.overview.newPlayers}
          value={metrics.newPlayers}
        />
        <KPICard
          title={LABELS.overview.welcomeGrants}
          value={metrics.welcomeGrants}
        />
        <KPICard
          title={LABELS.overview.welcomePrizesUsed}
          value={metrics.welcomePrizesUsed}
        />
        <KPICard
          title={LABELS.overview.redeemedPrizes}
          value={metrics.redeemedPrizes}
        />
        <KPICard
          title={LABELS.overview.unusedActive}
          value={metrics.unusedActive}
        />
        <KPICard
          title={LABELS.overview.winRate}
          value={metrics.winRate}
          format="percent"
        />
        <KPICard
          title={LABELS.overview.noWinRate}
          value={metrics.noWinRate}
          format="percent"
        />
        <KPICard
          title={LABELS.overview.avgSpinsPerPlayer}
          value={metrics.avgSpinsPerPlayer}
          format="decimal"
        />
        <KPICard
          title={LABELS.overview.avgIntervalBetweenSpins}
          value={avgIntervalDisplay}
        />
        <KPICard
          title={LABELS.overview.avgLifetimeDays}
          value={avgLifetimeDisplay}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{LABELS.overview.spinsOverTime}</CardTitle>
          </CardHeader>
          <CardContent>
            <SpinsOverTimeChart data={charts.spinsByDate} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.overview.activePlayersOverTime}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivePlayersChart data={charts.activePlayersByDate} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.overview.resultDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PrizeDistributionChart data={charts.resultDistribution} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.overview.topPrizesByCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopPrizesBarChart
              data={charts.topPrizesByCount.map((p) => ({ name: p.name, count: p.count }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.overview.topPrizesByUsage}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopPrizesBarChart
              data={charts.topPrizesByUsage.map((p) => ({ name: p.name, count: p.count }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.overview.topPlayerByRedemptions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {summaries.topPlayerByRedemptions.map((p, i) => (
                <li key={p.userId}>
                  {i + 1}. {p.userName}: {p.value}
                </li>
              ))}
              {summaries.topPlayerByRedemptions.length === 0 && (
                <li className="text-muted-foreground">Нет данных</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.overview.topPlayerBySpins}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {summaries.topPlayerBySpins.map((p, i) => (
                <li key={p.userId}>
                  {i + 1}. {p.userName}: {p.value}
                </li>
              ))}
              {summaries.topPlayerBySpins.length === 0 && (
                <li className="text-muted-foreground">Нет данных</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.overview.topPlayerByValuable}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {summaries.topPlayerByValuable.map((p, i) => (
                <li key={p.userId}>
                  {i + 1}. {p.userName}: {p.value}
                </li>
              ))}
              {summaries.topPlayerByValuable.length === 0 && (
                <li className="text-muted-foreground">Нет данных</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.overview.fairnessSummary}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Вращений колеса: {summaries.fairness.wheelSpinsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {LABELS.overview.anomaliesSummary}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Обнаружено аномалий: {summaries.anomalies.count} (высокая
            серьёзность: {summaries.anomalies.highSeverity})
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
