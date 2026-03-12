'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  name: string;
  count: number;
}

interface TopPrizesBarChartProps {
  data: DataPoint[];
  title?: string;
}

export function TopPrizesBarChart({ data, title }: TopPrizesBarChartProps) {
  const displayData = data.map((d) => ({
    ...d,
    name: d.name.length > 15 ? d.name.slice(0, 15) + '…' : d.name,
  }));

  return (
    <div className="h-64 w-full">
      {title && (
        <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={displayData} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v: number) => [v, '']} />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
