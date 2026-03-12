'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/components/filters/FilterContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap';
import { LABELS } from '@/config/labels';
import Link from 'next/link';

export function BehaviorContent() {
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
        const res = await fetch(`/api/behavior?${params}`);
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

  const heatmap = (data.heatmap ?? []) as { day: number; hour: number; count: number }[];
  const avgGapFormatted = data.avgGapFormatted as string | null;
  const medianGapFormatted = data.medianGapFormatted as string | null;
  const avgDaysToRedeem = data.avgDaysToRedeem as number | null;
  const playButRarelyRedeem = (data.playButRarelyRedeem ?? []) as { id: number; name: string }[];
  const redeemFrequently = (data.redeemFrequently ?? []) as { id: number; name: string }[];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {LABELS.behavior.activityHeatmap}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={heatmap} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{LABELS.behavior.avgGap}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {avgGapFormatted ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{LABELS.behavior.medianGap}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {medianGapFormatted ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{LABELS.behavior.daysToRedeem}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {avgDaysToRedeem != null ? avgDaysToRedeem.toFixed(1) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Играют, но редко используют призы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {playButRarelyRedeem.map((u) => (
                <li key={u.id}>
                  <Link href={`/players/${u.id}`} className="text-primary hover:underline">
                    {u.name}
                  </Link>
                </li>
              ))}
              {playButRarelyRedeem.length === 0 && (
                <li className="text-muted-foreground">Нет данных</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Часто используют призы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {redeemFrequently.map((u) => (
                <li key={u.id}>
                  <Link href={`/players/${u.id}`} className="text-primary hover:underline">
                    {u.name}
                  </Link>
                </li>
              ))}
              {redeemFrequently.length === 0 && (
                <li className="text-muted-foreground">Нет данных</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
