'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/components/filters/FilterContext';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpinsOverTimeChart } from '@/components/charts/SpinsOverTimeChart';
import { LABELS } from '@/config/labels';
import { formatPercent } from '@/lib/utils/format';

export function RedemptionsContent() {
  const { dateRange } = useFilters();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        });
        const res = await fetch(`/api/redemptions?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const d = await res.json();
        setData(d);
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

  if (error || !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-destructive">
          {LABELS.common.error}: {error ?? 'No data'}
        </div>
      </div>
    );
  }

  const metrics = data.metrics as {
    totalGranted: number;
    redeemed: number;
    unusedActive: number;
    unusedExpired: number;
    redemptionRate: number;
    expirationRate: number;
  };
  const dailyRedemptions = (data.dailyRedemptions ?? []) as { date: string; count: number }[];
  const dailyExpirations = (data.dailyExpirations ?? []) as { date: string; count: number }[];
  const welcomeRedemptions = (data.welcomeRedemptions ?? []) as { date: string; count: number }[];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KPICard title={LABELS.redemptions.totalGranted} value={metrics.totalGranted} />
        <KPICard title={LABELS.redemptions.redeemed} value={metrics.redeemed} />
        <KPICard title={LABELS.redemptions.unusedActive} value={metrics.unusedActive} />
        <KPICard title={LABELS.redemptions.unusedExpired} value={metrics.unusedExpired} />
        <KPICard
          title={LABELS.redemptions.redemptionRate}
          value={metrics.redemptionRate}
          format="percent"
        />
        <KPICard
          title={LABELS.redemptions.expirationRate}
          value={metrics.expirationRate}
          format="percent"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.redemptions.dailyRedemptions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpinsOverTimeChart data={dailyRedemptions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.redemptions.dailyExpirations}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpinsOverTimeChart data={dailyExpirations} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.redemptions.welcomeRedemptions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpinsOverTimeChart data={welcomeRedemptions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
