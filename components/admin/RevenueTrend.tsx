import { formatINR } from '@/lib/utils';

// Lightweight inline-SVG bar chart — no charting library dependency for one
// six-bar view. Server component: renders once with the month's data, no
// client JS needed.
export default function RevenueTrend({ data }: { data: { label: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const width = 560;
  const height = 160;
  const barGap = 18;
  const barWidth = (width - barGap * (data.length - 1)) / data.length;

  return (
    <div className="mt-6 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-48 w-full min-w-[420px]" role="img" aria-label="Revenue by month">
        {data.map((d, i) => {
          const barHeight = max > 0 ? (d.total / max) * height : 0;
          const x = i * (barWidth + barGap);
          const y = height - barHeight;
          return (
            <g key={d.label + i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={4}
                className={d.total > 0 ? 'fill-moss/70' : 'fill-ink/10'}
              />
              <text x={x + barWidth / 2} y={height + 18} textAnchor="middle" className="fill-ink/50 text-[11px]">
                {d.label}
              </text>
              {d.total > 0 && (
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="fill-ink/60 text-[10px]">
                  {formatINR(d.total)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
