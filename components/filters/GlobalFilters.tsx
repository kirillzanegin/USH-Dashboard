'use client';

import { PresetButtons } from './PresetButtons';
import { DateRangePicker } from './DateRangePicker';

export function GlobalFilters() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Период</p>
        <PresetButtons />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Произвольный период</p>
        <DateRangePicker />
      </div>
    </div>
  );
}
