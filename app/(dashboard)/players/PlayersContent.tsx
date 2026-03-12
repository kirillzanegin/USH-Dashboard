'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/components/filters/FilterContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LABELS } from '@/config/labels';
import { formatDuration } from '@/lib/utils/format';
import Link from 'next/link';

interface PlayerRow {
  user: { id: number };
  userName: string;
  registrationDate: string;
  spinsInPeriod: number;
  totalSpins: number;
  wonPrizes: number;
  noPrizes: number;
  welcomePrizes: number;
  redeemedPrizes: number;
  expiredPrizes: number;
  valuablePrizes: number;
  lastActivityFormatted: string;
  avgIntervalFormatted: string;
  activeDays: number;
}

interface PlayersApiResponse {
  players: PlayerRow[];
  leaderboards: {
    bySpins: LeaderboardEntry[];
    byRedeemed: LeaderboardEntry[];
    byWon: LeaderboardEntry[];
    byValuable: LeaderboardEntry[];
    byExpired: LeaderboardEntry[];
  };
  hasMore: boolean;
  page: number;
}

interface LeaderboardEntry {
  userId: number;
  userName: string;
  value: number;
}

export function PlayersContent() {
  const { dateRange } = useFilters();
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [data, setData] = useState<PlayersApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeSort, setActiveSort] = useState<'bySpins' | 'byRedeemed' | 'byWon' | 'byValuable' | 'byExpired'>('bySpins');
  const pageSize = 20;

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    // при смене фильтров/поиска начинаем с первой страницы
    setPage(1);
  }, [dateRange, searchDebounced, activeSort]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
          page: String(page),
          pageSize: String(pageSize),
        });
        if (searchDebounced) params.set('search', searchDebounced);
        params.set('sort', activeSort.replace('by', '').toLowerCase());
        const response = await fetch(`/api/players?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const respData: PlayersApiResponse = await response.json();

        // если page === 1, заменяем, иначе накапливаем
        if (page === 1 || !data) {
          setData(respData);
        } else {
          setData({
            ...respData,
            players: [...(data?.players ?? []), ...respData.players],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, searchDebounced, page, activeSort]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">{LABELS.common.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-destructive">{LABELS.common.error}: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { players, leaderboards } = data;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Input
          placeholder={LABELS.players.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {([
          { key: 'bySpins', label: LABELS.players.leaderboards.bySpins },
          { key: 'byRedeemed', label: LABELS.players.leaderboards.byRedeemed },
          { key: 'byWon', label: LABELS.players.leaderboards.byWon },
          { key: 'byValuable', label: LABELS.players.leaderboards.byValuable },
          { key: 'byExpired', label: LABELS.players.leaderboards.byExpired },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveSort(key);
              setPage(1);
            }}
            className="text-left"
          >
            <Card
              className={
                activeSort === key
                  ? 'border-primary shadow-sm'
                  : 'hover:border-primary/50'
              }
            >
              <CardHeader>
                <CardTitle className="text-sm">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {(leaderboards[key] ?? []).map((p, i) => (
                    <li key={p.userId}>
                      <Link
                        href={`/players/${p.userId}`}
                        className="text-primary hover:underline"
                      >
                        {i + 1}. {p.userName}
                      </Link>
                      : {p.value}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{LABELS.pages.players}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[60vh] overflow-auto">
            <div className="min-w-full overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.common.player}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.registrationDate}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.spinsInPeriod}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.totalSpins}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.wonPrizes}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.noPrizes}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.welcomePrizes}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.redeemedPrizes}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.expiredPrizes}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.valuablePrizes}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.lastActivity}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.avgInterval}
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background">
                    {LABELS.players.activeDays}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((p) => (
                  <TableRow key={p.user.id}>
                    <TableCell>
                      <Link
                        href={`/players/${p.user.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.userName}
                      </Link>
                    </TableCell>
                    <TableCell>{p.registrationDate}</TableCell>
                    <TableCell>{p.spinsInPeriod}</TableCell>
                    <TableCell>{p.totalSpins}</TableCell>
                    <TableCell>{p.wonPrizes}</TableCell>
                    <TableCell>{p.noPrizes}</TableCell>
                    <TableCell>{p.welcomePrizes}</TableCell>
                    <TableCell>{p.redeemedPrizes}</TableCell>
                    <TableCell>{p.expiredPrizes}</TableCell>
                    <TableCell>{p.valuablePrizes}</TableCell>
                    <TableCell>{p.lastActivityFormatted}</TableCell>
                    <TableCell>{p.avgIntervalFormatted}</TableCell>
                    <TableCell>{p.activeDays}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          </div>
          {data.hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                Показать ещё 20
              </button>
            </div>
          )}
          {players.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              {LABELS.common.noData}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
