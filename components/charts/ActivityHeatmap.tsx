'use client';

interface Cell {
  day: number;
  hour: number;
  count: number;
}

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

interface ActivityHeatmapProps {
  data: Cell[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-[500px]">
        <div className="mb-2 text-sm font-medium">Час (UTC)</div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="h-4 leading-4">
                {h}
              </div>
            ))}
          </div>
          <div className="flex flex-1 gap-0.5">
            {DAY_LABELS.map((_, dayIdx) => (
              <div key={dayIdx} className="flex flex-1 flex-col gap-0.5">
                {Array.from({ length: 24 }, (_, hourIdx) => {
                  const cell = data.find(
                    (d) => d.day === dayIdx && d.hour === hourIdx
                  );
                  const count = cell?.count ?? 0;
                  const opacity = maxCount > 0 ? count / maxCount : 0;
                  return (
                    <div
                      key={hourIdx}
                      className="h-4 w-full rounded-sm transition-colors"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${0.2 + opacity * 0.8})`,
                      }}
                      title={`${DAY_LABELS[dayIdx]} ${hourIdx}:00 — ${count}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1 flex justify-around text-xs text-muted-foreground">
          {DAY_LABELS.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
