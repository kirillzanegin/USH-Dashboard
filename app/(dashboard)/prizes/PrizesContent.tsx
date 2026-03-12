'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/components/filters/FilterContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LABELS } from '@/config/labels';
import { formatPercent } from '@/lib/utils/format';

export function PrizesContent() {
  const { dateRange } = useFilters();
  const [data, setData] = useState<{
    prizes: Array<{
      prize: { id: number; name: string | null; weight: number | null };
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
    }>;
    fairness: {
      totalWeight: number;
      wheelSpinsCount: number;
      data: Array<{ name: string; expected: number; actual: number; deviation: number }>;
    };
  } | null>(null);
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
        const res = await fetch(`/api/prizes?${params}`);
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

  const { prizes, fairness } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{LABELS.prizes.fairnessSection}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Всего вес: {fairness.totalWeight}, вращений для анализа:{' '}
            {fairness.wheelSpinsCount}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fairness.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v.length > 12 ? v.slice(0, 12) + '…' : v)}
                />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, '']} />
                <Legend />
                <Bar dataKey="expected" name="Ожидаемая %" fill="hsl(var(--muted-foreground))" />
                <Bar dataKey="actual" name="Фактическая %" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{LABELS.pages.prizes}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{LABELS.prizes.id}</TableHead>
                <TableHead>{LABELS.prizes.name}</TableHead>
                <TableHead>{LABELS.prizes.expectedProb}</TableHead>
                <TableHead>{LABELS.prizes.actualProb}</TableHead>
                <TableHead>{LABELS.prizes.deviation}</TableHead>
                <TableHead>{LABELS.prizes.grantedTotal}</TableHead>
                <TableHead>{LABELS.prizes.grantedInPeriod}</TableHead>
                <TableHead>{LABELS.prizes.redeemed}</TableHead>
                <TableHead>{LABELS.prizes.usageRateInPeriod}</TableHead>
                <TableHead>{LABELS.prizes.unusedActive}</TableHead>
                <TableHead>{LABELS.prizes.unusedExpired}</TableHead>
                <TableHead>{LABELS.prizes.redemptionRate}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prizes.map((p) => {
                const usageRateInPeriod =
                  p.grantedInPeriod > 0 ? p.redeemed / p.grantedInPeriod : 0;

                return (
                  <TableRow key={p.prize.id}>
                    <TableCell>{p.prize.id}</TableCell>
                    <TableCell>
                      {p.prize.name ?? `#${p.prize.id}`}
                      {p.isWelcome && (
                        <Badge variant="secondary" className="ml-1">
                          {LABELS.prizes.typeWelcome}
                        </Badge>
                      )}
                      {p.isValuable && !p.isWelcome && (
                        <Badge variant="outline" className="ml-1">
                          {LABELS.prizes.valuableFlag}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.expectedProb !== null
                        ? formatPercent(p.expectedProb)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {p.actualProb !== null ? formatPercent(p.actualProb) : '—'}
                    </TableCell>
                    <TableCell>
                      {p.deviation !== null
                        ? `${(p.deviation * 100).toFixed(2)} п.п.`
                        : '—'}
                    </TableCell>
                    <TableCell>{p.grantedTotal}</TableCell>
                    <TableCell>{p.grantedInPeriod}</TableCell>
                    <TableCell>{p.redeemed}</TableCell>
                    <TableCell>{formatPercent(usageRateInPeriod)}</TableCell>
                    <TableCell>{p.unusedActive}</TableCell>
                    <TableCell>{p.unusedExpired}</TableCell>
                    <TableCell>{formatPercent(p.redemptionRate)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
