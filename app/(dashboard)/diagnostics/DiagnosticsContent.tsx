'use client';

import { useEffect, useState } from 'react';
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

export function DiagnosticsContent() {
  const [data, setData] = useState<{
    checks: Array<{ name: string; passed: boolean; count: number; message: string; details?: unknown[] }>;
    tableStats: Array<{ tableName: string; rowCount: number }>;
    connected: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<{
    name: string;
    details: { user_id: number; date: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/diagnostics');
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
  }, []);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{LABELS.diagnostics.dbConnectivity}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={data.connected ? 'default' : 'destructive'}>
            {data.connected ? 'Подключено' : 'Нет подключения'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{LABELS.diagnostics.rowCounts}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Таблица</TableHead>
                <TableHead>Записей</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tableStats.map((t) => (
                <TableRow key={t.tableName}>
                  <TableCell>{t.tableName}</TableCell>
                  <TableCell>{t.rowCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Проверки целостности</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Проверка</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Кол-во</TableHead>
                <TableHead>Сообщение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.checks.map((c) => (
                <TableRow
                  key={c.name}
                  className={c.details && c.count > 0 ? 'cursor-pointer hover:bg-muted/50' : undefined}
                  onClick={() => {
                    if (c.details && c.count > 0) {
                      setSelectedDetails({
                        name: c.name,
                        details: c.details as { user_id: number; date: string; count: number }[],
                      });
                    }
                  }}
                >
                  <TableCell>{c.name}</TableCell>
                  <TableCell>
                    <Badge variant={c.passed ? 'default' : 'destructive'}>
                      {c.passed ? 'OK' : 'Ошибка'}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.count}</TableCell>
                  <TableCell>{c.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {selectedDetails && (
            <div className="mt-6 rounded-md border bg-muted/40 p-4">
              <h3 className="mb-2 text-sm font-semibold">
                Детали проверки: {selectedDetails.name}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>user_id</TableHead>
                    <TableHead>Дата (UTC)</TableHead>
                    <TableHead>Вращений в этот день</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDetails.details.map((d) => (
                    <TableRow key={`${d.user_id}-${d.date}`}>
                      <TableCell>{d.user_id}</TableCell>
                      <TableCell>{d.date}</TableCell>
                      <TableCell>{d.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
