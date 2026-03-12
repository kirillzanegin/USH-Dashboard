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
import { LABELS } from '@/config/labels';
import Link from 'next/link';

interface AnomalyRow {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high';
  entityType: 'user' | 'prize' | 'system';
  entityId: number | null;
  entityName: string;
  explanation: string;
  metrics: Record<string, unknown>;
}

export function AnomaliesContent() {
  const { dateRange } = useFilters();
  const [data, setData] = useState<{
    anomalies: AnomalyRow[];
    total: number;
    bySeverity: { high: number; medium: number; low: number };
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
        const res = await fetch(`/api/anomalies?${params}`);
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

  const severityLabel = (s: string) =>
    s === 'high'
      ? LABELS.anomalies.severityHigh
      : s === 'medium'
        ? LABELS.anomalies.severityMedium
        : LABELS.anomalies.severityLow;

  const severityVariant = (s: string) =>
    s === 'high' ? 'destructive' : s === 'medium' ? 'default' : 'secondary';

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <p>
          Всего: <strong>{data.total}</strong>
        </p>
        <p>
          {LABELS.anomalies.severityHigh}:{' '}
          <Badge variant="destructive">{data.bySeverity.high}</Badge>
        </p>
        <p>
          {LABELS.anomalies.severityMedium}:{' '}
          <Badge>{data.bySeverity.medium}</Badge>
        </p>
        <p>
          {LABELS.anomalies.severityLow}:{' '}
          <Badge variant="secondary">{data.bySeverity.low}</Badge>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{LABELS.pages.anomalies}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{LABELS.anomalies.rule}</TableHead>
                <TableHead>{LABELS.anomalies.severity}</TableHead>
                <TableHead>{LABELS.anomalies.entity}</TableHead>
                <TableHead>{LABELS.anomalies.explanation}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.anomalies.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.ruleName}</TableCell>
                  <TableCell>
                    <Badge variant={severityVariant(a.severity)}>
                      {severityLabel(a.severity)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {a.entityType === 'user' && a.entityId ? (
                      <Link
                        href={`/players/${a.entityId}`}
                        className="text-primary hover:underline"
                      >
                        {a.entityName}
                      </Link>
                    ) : (
                      a.entityName
                    )}
                  </TableCell>
                  <TableCell>{a.explanation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.anomalies.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Аномалий не обнаружено
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
