'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/components/filters/FilterContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LABELS } from '@/config/labels';
import { formatDateTime } from '@/lib/date/ranges';
import Link from 'next/link';

interface PlayerDetailContentProps {
  id: string;
}

export function PlayerDetailContent({ id }: PlayerDetailContentProps) {
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
        const res = await fetch(`/api/players/${id}?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const d = await res.json();
        setData(d);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, dateRange]);

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

  const user = data.user as { id: number; first_name?: string; username?: string; created_at?: string };
  const stats = data.stats as {
    spinsInPeriod: number;
    totalSpins: number;
    wonPrizes: number;
    noPrizes: number;
    welcomePrizes: number;
    redeemedPrizes: number;
    expiredPrizes: number;
    valuablePrizes: number;
    lastActivity: string | null;
  };
  const spins = (data.spins ?? []) as Array<{ id: number; prize_id: number; created_at: string; used_at: string | null }>;

  return (
    <div className="space-y-6">
      <Link href="/players" className="text-primary hover:underline">
        ← Назад к списку
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>
            {user?.first_name || user?.username || `User #${id}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>ID: {user?.id}</p>
          <p>Регистрация: {user?.created_at ? formatDateTime(user.created_at) : '—'}</p>
          <p>Вращений за период: {stats?.spinsInPeriod ?? 0}</p>
          <p>Всего вращений: {stats?.totalSpins ?? 0}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Выиграно призов: {stats?.wonPrizes ?? 0}</p>
          <p>«Ничего»: {stats?.noPrizes ?? 0}</p>
          <p>Welcome: {stats?.welcomePrizes ?? 0}</p>
          <p>Использовано: {stats?.redeemedPrizes ?? 0}</p>
          <p>Просрочено: {stats?.expiredPrizes ?? 0}</p>
          <p>Ценных призов: {stats?.valuablePrizes ?? 0}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние вращения</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {spins.slice(0, 20).map((s) => (
              <li key={s.id}>
                {formatDateTime(s.created_at)} — приз #{s.prize_id}
                {s.used_at ? ' (использован)' : ''}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
