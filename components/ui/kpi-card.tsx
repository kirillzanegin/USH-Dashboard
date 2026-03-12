import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatPercent } from '@/lib/utils/format';

interface KPICardProps {
  title: string;
  value: number | string;
  format?: 'number' | 'percent' | 'decimal';
  decimals?: number;
}

export function KPICard({ title, value, format = 'number', decimals = 1 }: KPICardProps) {
  let displayValue: string;

  if (typeof value === 'string') {
    displayValue = value;
  } else {
    switch (format) {
      case 'percent':
        displayValue = formatPercent(value, decimals);
        break;
      case 'decimal':
        displayValue = value.toFixed(decimals);
        break;
      case 'number':
      default:
        displayValue = formatNumber(Math.round(value));
        break;
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
      </CardContent>
    </Card>
  );
}
