import Link from "next/link";
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
import type { DashboardGrowth } from "@/server/reporting/growth";
import { AdminSection } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

function accraDate(isoDay: string) {
  const day = isoDay.slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00+00:00`) : new Date(isoDay);
  return Number.isNaN(date.getTime()) ? null : date;
}

function accraDayLabel(isoDay: string, mode: "narrow" | "short" = "narrow") {
  const date = accraDate(isoDay);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GH", {
    weekday: mode,
    timeZone: "Africa/Accra",
  }).format(date);
}

function accraDayNumber(isoDay: string) {
  const date = accraDate(isoDay);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    timeZone: "Africa/Accra",
  }).format(date);
}

function Delta({ current, previous, unit }: { current: number; previous: number; unit?: string }) {
  const pct = pctChange(current, previous);
  if (pct == null) {
    return <span className="text-xs text-muted">No previous 7 Accra days to compare</span>;
  }
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span className={cn("text-xs tabular-nums", flat ? "text-muted" : up ? "text-foreground" : "text-accent")}>
      {flat ? "Same as" : up ? `Up ${pct}% from` : `Down ${Math.abs(pct)}% from`} last 7 Accra days
      {unit ? ` · was ${unit}` : ""}
    </span>
  );
}

function PaidColumns({ days }: { days: DashboardGrowth["days"] }) {
  const max = chartMax(days.map((d) => d.paidGhs));
  const innerH = 128;
  const w = Math.max(days.length * 28, 320);
  const gap = 6;
  const barW = (w - gap * (days.length + 1)) / days.length;
  return (
    <figure className="min-w-0">
      <svg
        role="img"
        aria-label="Paid Cedis for each of the last 14 Accra days"
        viewBox={`0 0 ${w} 168`}
        className="h-[11.5rem] w-full"
      >
        {days.map((d, i) => {
          const h = barHeight(d.paidGhs, max, innerH);
          const x = gap + i * (barW + gap);
          const y = 8 + innerH - h;
          const isToday = i === days.length - 1;
          return (
            <g key={d.day}>
              <rect x={x} y={8} width={barW} height={innerH} fill="color-mix(in srgb, var(--accent) 6%, #fffdf8)" />
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={isToday ? "var(--accent)" : "color-mix(in srgb, var(--accent) 55%, #3a1c1c)"}
              />
              <text
                x={x + barW / 2}
                y={148}
                textAnchor="middle"
                className="fill-current"
                fill="currentColor"
                fontSize="9"
                opacity={0.55}
              >
                {accraDayLabel(d.day)}
              </text>
              <text
                x={x + barW / 2}
                y={162}
                textAnchor="middle"
                fill="currentColor"
                fontSize="9"
                opacity={0.85}
              >
                {accraDayNumber(d.day)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        {days.map((d) => `${d.day}: ${formatGhs(d.paidGhs)}, ${d.paidOrders} paid`).join(". ")}
      </figcaption>
      <p className="mt-1 text-xs text-muted">
        {days.every((d) => d.paidGhs <= 0)
          ? "No paid Cedis in these 14 Accra days yet. Delivery is not added into paid."
          : `Scale to ${formatGhsShort(max)}. Delivery is not in these Cedis.`}
      </p>
    </figure>
  );
}

function OrderDots({ days }: { days: DashboardGrowth["days"] }) {
  const values = days.map((d) => d.paidOrders);
  const max = chartMax(values);
  const w = 280;
  const h = 72;
  const points = sparkPoints(values, w, h, 6);
  return (
    <svg role="img" aria-label="Paid order count over 14 Accra days" viewBox={`0 0 ${w} ${h}`} className="h-16 w-full">
      <polyline
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        points={points}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {days.map((d, i) => {
        const x = values.length === 1 ? w / 2 : 6 + (i * (w - 12)) / (values.length - 1);
        const y = 6 + (h - 12) - (d.paidOrders / max) * (h - 12);
        return <circle key={d.day} cx={x} cy={y} r={i === days.length - 1 ? 3.5 : 2} fill="var(--accent)" />;
      })}
    </svg>
  );
}

function MixDonut({
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

function ShareList({
  rows,
  valueOf,
  labelOf,
  format,
}: {
  rows: { name?: string; label?: string; units?: number; orders?: number; revenue: number }[];
  valueOf: (row: { units?: number; orders?: number; revenue: number }) => number;
  labelOf: (row: { name?: string; label?: string }) => string;
  format: (row: { units?: number; orders?: number; revenue: number }) => string;
}) {
  const max = Math.max(...rows.map(valueOf), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={labelOf(row)}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{labelOf(row)}</span>
            <span className="shrink-0 font-serif tabular-nums">{format(row)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-[color-mix(in_srgb,var(--accent)_8%,#f4ebe3)]">
            <div
              className="h-full rounded-sm bg-accent"
              style={{ width: `${shareWidth(valueOf(row), max)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PipelineStrip({ items }: { items: { label: string; count: number }[] }) {
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

export function HomeGrowth({ growth, canReports }: { growth: DashboardGrowth; canReports: boolean }) {
  const spark = sparkPoints(
    growth.days.map((d) => d.paidGhs),
    120,
    36,
    2,
  );

  return (
    <div className="mt-8 space-y-6">
      <AdminSection
        title="How the shop is growing"
        hint="Accra time. Paid is money taken on the order, not a delivery charge. Compared with the previous 7 Accra days."
        action={
          canReports ? (
            <Link href="/admin/analytics" className="inline-flex min-h-11 items-center text-sm text-accent">
              Analytics
            </Link>
          ) : null
        }
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Paid this Accra week</p>
            <p className="mt-2 font-serif text-4xl leading-none tabular-nums sm:text-5xl">{formatGhs(growth.thisPaid)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <svg viewBox="0 0 120 36" className="h-9 w-28 text-accent" aria-hidden>
                <polyline fill="none" stroke="currentColor" strokeWidth="2" points={spark} />
              </svg>
              <Delta current={growth.thisPaid} previous={growth.prevPaid} unit={formatGhs(growth.prevPaid)} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Paid orders</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{growth.thisOrders}</dd>
                <Delta current={growth.thisOrders} previous={growth.prevOrders} />
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Typical paid ticket</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{formatGhs(growth.thisAov)}</dd>
                <Delta current={growth.thisAov} previous={growth.prevAov} />
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">New customers</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{growth.thisCustomers}</dd>
                <Delta current={growth.thisCustomers} previous={growth.prevCustomers} />
              </div>
            </dl>
            <p className="mt-5 text-sm text-muted">
              Paid overall {formatGhs(growth.allTimePaid)} across {growth.allTimeOrders} paid orders.
            </p>
          </div>
          <div className="min-w-0 border-t border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Paid orders each day</p>
            <OrderDots days={growth.days} />
            <p className="mt-2 text-xs text-muted">Dots are paid tickets, not visits.</p>
          </div>
        </div>
      </AdminSection>

      <section className="admin-panel">
        <h2 className="text-[1.35rem] leading-tight">Paid takings, last 14 Accra days</h2>
        <p className="mt-1.5 text-sm text-muted">Each column is that Accra day’s paid Cedis. Today is the red column on the right.</p>
        <div className="mt-4 overflow-x-auto">
          <PaidColumns days={growth.days} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="What sold, last 30 Accra days" hint="Paid pieces only. DEMO SKUs are blocked at checkout, so they should not appear here.">
          {growth.sellers.length === 0 ? (
            <p className="text-sm text-muted">No paid items in the last 30 Accra days yet.</p>
          ) : (
            <ShareList
              rows={growth.sellers.map((s) => ({ name: s.name, units: s.units, revenue: s.revenue }))}
              valueOf={(row) => row.units ?? 0}
              labelOf={(row) => row.name ?? ""}
              format={(row) => `${row.units} · ${formatGhs(row.revenue)}`}
            />
          )}
        </AdminSection>
        <AdminSection title="Where paid orders came from" hint="Region written at checkout. Empty region falls back to city.">
          {growth.regions.length === 0 ? (
            <p className="text-sm text-muted">No paid addresses in the last 30 Accra days yet.</p>
          ) : (
            <ShareList
              rows={growth.regions.map((r) => ({ label: r.label, orders: r.orders, revenue: r.revenue }))}
              valueOf={(row) => row.orders ?? 0}
              labelOf={(row) => row.label ?? ""}
              format={(row) => `${row.orders} · ${formatGhs(row.revenue)}`}
            />
          )}
        </AdminSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="How they take the goods" hint="Collection vs delivery on paid orders in the last 30 Accra days. Timing and charge are still quoted on WhatsApp.">
          <MixDonut
            caption="Paid delivery versus collection"
            slices={[
              { label: "Delivery", value: growth.deliveryOrders, fill: "var(--accent)" },
              { label: "Collect at shop", value: growth.collectionOrders, fill: "#3a1c1c" },
            ]}
          />
        </AdminSection>
        <AdminSection title="Who paid" hint="Returning means that customer already had a paid order before this one. Guest is checkout without a shop account.">
          <MixDonut
            caption="Guest, first paid, and returning customers"
            slices={[
              { label: "Returning", value: growth.returningPaid, fill: "var(--accent)" },
              { label: "First paid order", value: growth.firstPaid, fill: "color-mix(in srgb, var(--accent) 55%, #3a1c1c)" },
              { label: "Guest checkout", value: growth.guestPaid, fill: "#3a1c1c" },
            ]}
          />
        </AdminSection>
      </div>

      <AdminSection title="Orders still on the books" hint="Live counts, not a forecast. Waiting is unpaid. Delivered includes collected at the shop.">
        <PipelineStrip items={growth.pipeline} />
      </AdminSection>

      {growth.visitDays.some((d) => d.views > 0) ? (
        <AdminSection
          title="Shop views beside paid tickets"
          hint="Views count after a shopper taps Accept all. They are interest, not sales."
        >
          <VisitCompare days={growth.days} visits={growth.visitDays} />
        </AdminSection>
      ) : null}
    </div>
  );
}

function VisitCompare({
  days,
  visits,
}: {
  days: DashboardGrowth["days"];
  visits: DashboardGrowth["visitDays"];
}) {
  const viewMap = new Map(visits.map((v) => [v.day, v.views]));
  const rows = days.map((d) => ({
    day: d.day,
    views: viewMap.get(d.day) ?? 0,
    paid: d.paidOrders,
  }));
  const max = chartMax(rows.flatMap((r) => [r.views, r.paid * 8]));
  return (
    <ul className="flex gap-1 overflow-x-auto pb-1">
      {rows.map((row) => (
        <li key={row.day} className="flex w-7 shrink-0 flex-col items-center gap-1 sm:w-8">
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
          <span className="text-[10px] text-muted">{accraDayLabel(row.day)}</span>
        </li>
      ))}
    </ul>
  );
}
