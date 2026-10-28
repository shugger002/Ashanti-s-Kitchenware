import { formatGhs } from "@/lib/money";
import {
  barHeight,
  chartMax,
  formatGhsShort,
  pctChange,
  polarArc,
  shareWidth,
  sparkPoints,
} from "@/lib/admin-charts";
import { cn } from "@/lib/utils";

function accraDate(isoDay: string) {
  const day = isoDay.slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00+00:00`) : new Date(isoDay);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function accraDayLabel(isoDay: string, mode: "narrow" | "short" = "narrow") {
  const date = accraDate(isoDay);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GH", {
    weekday: mode,
    timeZone: "Africa/Accra",
  }).format(date);
}

export function accraDayNumber(isoDay: string) {
  const date = accraDate(isoDay);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    timeZone: "Africa/Accra",
  }).format(date);
}

export function DeskDelta({
  current,
  previous,
  unit,
  compare,
}: {
  current: number;
  previous: number;
  unit?: string;
  compare: string;
}) {
  const pct = pctChange(current, previous);
  if (pct == null) {
    return <span className="text-xs text-muted">No previous {compare} to compare</span>;
  }
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span className={cn("text-xs tabular-nums", flat ? "text-muted" : up ? "text-foreground" : "text-accent")}>
      {flat ? "Same as" : up ? `Up ${pct}% from` : `Down ${Math.abs(pct)}% from`} {compare}
      {unit ? ` · was ${unit}` : ""}
    </span>
  );
}

export type DeskColumn = {
  key: string;
  value: number;
  top?: string;
  bottom: string;
  extra?: string;
};

export function DeskColumns({
  points,
  ariaLabel,
  emptyHint,
  filledHint,
}: {
  points: DeskColumn[];
  ariaLabel: string;
  emptyHint: string;
  filledHint?: string;
}) {
  const max = chartMax(points.map((d) => d.value));
  const innerH = 128;
  const w = Math.max(points.length * 22, 320);
  const gap = 5;
  const barW = (w - gap * (points.length + 1)) / Math.max(points.length, 1);
  return (
    <figure className="min-w-0">
      <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${w} 168`} className="h-[11.5rem] w-full">
        {points.map((d, i) => {
          const h = barHeight(d.value, max, innerH);
          const x = gap + i * (barW + gap);
          const y = 8 + innerH - h;
          const isLast = i === points.length - 1;
          return (
            <g key={d.key}>
              <rect x={x} y={8} width={barW} height={innerH} fill="color-mix(in srgb, var(--accent) 6%, #fffdf8)" />
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={isLast ? "var(--accent)" : "color-mix(in srgb, var(--accent) 55%, #3a1c1c)"}
              />
              {d.top ? (
                <text x={x + barW / 2} y={148} textAnchor="middle" fill="currentColor" fontSize="9" opacity={0.55}>
                  {d.top}
                </text>
              ) : null}
              <text x={x + barW / 2} y={162} textAnchor="middle" fill="currentColor" fontSize="9" opacity={0.85}>
                {d.bottom}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        {points.map((d) => `${d.key}: ${d.extra ?? d.value}`).join(". ")}
      </figcaption>
      <p className="mt-1 text-xs text-muted">
        {points.every((d) => d.value <= 0) ? emptyHint : (filledHint ?? `Scale to ${formatGhsShort(max)}. Delivery is not in these Cedis.`)}
      </p>
    </figure>
  );
}

export function DeskSparkline({ values, label }: { values: number[]; label: string }) {
  const max = chartMax(values);
  const w = 280;
  const h = 72;
  const points = sparkPoints(values, w, h, 6);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} className="h-16 w-full">
      <polyline
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        points={points}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((value, i) => {
        const x = values.length === 1 ? w / 2 : 6 + (i * (w - 12)) / (values.length - 1);
        const y = 6 + (h - 12) - (value / max) * (h - 12);
        return <circle key={`${i}-${value}`} cx={x} cy={y} r={i === values.length - 1 ? 3.5 : 2} fill="var(--accent)" />;
      })}
    </svg>
  );
}

export function MixDonut({
  slices,
  caption,
}: {
  slices: { label: string; value: number; fill: string }[];
  caption: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let cursor = 0;
  const cx = 48;
  const cy = 48;
  const r = 36;
  return (
    <div className="flex items-center gap-4">
      <svg role="img" aria-label={caption} viewBox="0 0 96 96" className="h-24 w-24 shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="color-mix(in srgb, var(--accent) 8%, #fffdf8)" />
        {total === 0 ? null : (
          <>
            {slices.map((slice) => {
              const fraction = slice.value / total;
              const d = polarArc(cursor, fraction, r, cx, cy);
              cursor += fraction;
              return <path key={slice.label} d={d} fill={slice.fill} />;
            })}
            <circle cx={cx} cy={cy} r={20} fill="#fffdf8" />
          </>
        )}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fill="currentColor" className="font-serif">
          {total}
        </text>
      </svg>
      <ul className="min-w-0 space-y-1.5 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: slice.fill }} />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type ShareRow = {
  key: string;
  label: string;
  value: number;
  display: string;
};

export function ShareList({ rows }: { rows: ShareRow[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 font-serif tabular-nums">{row.display}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-[color-mix(in_srgb,var(--accent)_8%,#f4ebe3)]">
            <div className="h-full rounded-sm bg-accent" style={{ width: `${shareWidth(row.value, max)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PipelineStrip({ items }: { items: { label: string; count: number }[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-sm bg-[color-mix(in_srgb,var(--accent)_8%,#f4ebe3)]">
        {items.map((item, i) => {
          if (!item.count || !total) return null;
          const tones = [
            "color-mix(in srgb, var(--accent) 35%, #eadfd4)",
            "color-mix(in srgb, var(--accent) 70%, #3a1c1c)",
            "#3a1c1c",
            "var(--accent)",
          ];
          return (
            <div
              key={item.label}
              title={`${item.label}: ${item.count}`}
              className="h-full"
              style={{ width: `${(item.count / total) * 100}%`, background: tones[i] ?? "var(--accent)" }}
            />
          );
        })}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        {items.map((item) => (
          <li key={item.label} className="flex justify-between gap-2">
            <span className="text-muted">{item.label}</span>
            <span className="tabular-nums">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VisitCompare({
  rows,
}: {
  rows: { key: string; label: string; views: number; paid: number }[];
}) {
  const max = chartMax(rows.flatMap((r) => [r.views, r.paid * 8]));
  return (
    <ul className="flex gap-1 overflow-x-auto pb-1">
      {rows.map((row) => (
        <li key={row.key} className="flex w-7 shrink-0 flex-col items-center gap-1 sm:w-8">
          <div className="flex h-24 w-full items-end justify-center gap-0.5">
            <span
              className="w-1.5 rounded-sm bg-[color-mix(in_srgb,var(--accent)_25%,#eadfd4)]"
              style={{ height: `${barHeight(row.views, max, 96)}px` }}
              title={`${row.views} views`}
            />
            <span
              className="w-1.5 rounded-sm bg-accent"
              style={{ height: `${barHeight(row.paid * 8, max, 96)}px` }}
              title={`${row.paid} paid`}
            />
          </div>
          <span className="text-[10px] text-muted">{row.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function paidDayColumns(
  days: { day: string; paidGhs: number; paidOrders: number }[],
): DeskColumn[] {
  return days.map((d) => ({
    key: d.day,
    value: d.paidGhs,
    top: accraDayLabel(d.day),
    bottom: accraDayNumber(d.day),
    extra: `${formatGhs(d.paidGhs)}, ${d.paidOrders} paid`,
  }));
}
