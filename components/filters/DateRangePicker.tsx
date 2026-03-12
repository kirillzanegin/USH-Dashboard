'use client';

import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LABELS } from '@/config/labels';
import { useFilters } from './FilterContext';

export function DateRangePicker() {
  const { setCustomRange, setPreset } = useFilters();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const defaultFrom = format(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  );
  const defaultTo = format(new Date(), 'yyyy-MM-dd');

  const from = fromParam || defaultFrom;
  const to = toParam || defaultTo;

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formFrom = (form.elements.namedItem('from') as HTMLInputElement).value;
    const formTo = (form.elements.namedItem('to') as HTMLInputElement).value;

    setCustomRange({
      from: new Date(formFrom + 'T00:00:00.000Z'),
      to: new Date(formTo + 'T23:59:59.999Z'),
    });
  };

  const handleReset = () => {
    setPreset('7days');
  };

  return (
    <form onSubmit={handleApply} className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-muted-foreground">
        {LABELS.filters.dateFrom}
      </label>
      <Input type="date" name="from" defaultValue={from} className="w-40" />
      <label className="text-sm text-muted-foreground">
        {LABELS.filters.dateTo}
      </label>
      <Input type="date" name="to" defaultValue={to} className="w-40" />
      <Button type="submit" size="sm">
        {LABELS.filters.apply}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleReset}>
        {LABELS.filters.reset}
      </Button>
    </form>
  );
}
