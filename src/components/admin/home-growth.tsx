import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { sparkPoints } from "@/lib/admin-charts";
import type { DashboardGrowth } from "@/server/reporting/growth";
import { AdminSection } from "@/components/admin/ui";
import {
  DeskColumns,
  DeskDelta,
  DeskSparkline,
  MixDonut,
  PipelineStrip,
  ShareList,
  VisitCompare,
  accraDayLabel,
  paidDayColumns,
} from "@/components/admin/desk-charts";

export function HomeGrowth({ growth, canReports }: { growth: DashboardGrowth; canReports: boolean }) {
  const spark = sparkPoints(
    growth.days.map((d) => d.paidGhs),
    120,
    36,
    2,
  );
  const compare = "last 7 Accra days";

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
              <DeskDelta current={growth.thisPaid} previous={growth.prevPaid} unit={formatGhs(growth.prevPaid)} compare={compare} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Paid orders</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{growth.thisOrders}</dd>
                <DeskDelta current={growth.thisOrders} previous={growth.prevOrders} compare={compare} />
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Typical paid ticket</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{formatGhs(growth.thisAov)}</dd>
                <DeskDelta current={growth.thisAov} previous={growth.prevAov} compare={compare} />
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">New customers</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{growth.thisCustomers}</dd>
                <DeskDelta current={growth.thisCustomers} previous={growth.prevCustomers} compare={compare} />
              </div>
            </dl>
            <p className="mt-5 text-sm text-muted">
              Paid overall {formatGhs(growth.allTimePaid)} across {growth.allTimeOrders} paid orders.
            </p>
          </div>
          <div className="min-w-0 border-t border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Paid orders each day</p>
            <DeskSparkline values={growth.days.map((d) => d.paidOrders)} label="Paid order count over 14 Accra days" />
            <p className="mt-2 text-xs text-muted">Dots are paid tickets, not visits.</p>
          </div>
        </div>
      </AdminSection>

      <section className="admin-panel">
        <h2 className="text-[1.35rem] leading-tight">Paid takings, last 14 Accra days</h2>
        <p className="mt-1.5 text-sm text-muted">Each column is that Accra day’s paid Cedis. Today is the red column on the right.</p>
        <div className="mt-4 overflow-x-auto">
          <DeskColumns
            points={paidDayColumns(growth.days)}
            ariaLabel="Paid Cedis for each of the last 14 Accra days"
            emptyHint="No paid Cedis in these 14 Accra days yet. Delivery is not added into paid."
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="What sold, last 30 Accra days" hint="Paid pieces only. DEMO SKUs are blocked at checkout, so they should not appear here.">
          {growth.sellers.length === 0 ? (
            <p className="text-sm text-muted">No paid items in the last 30 Accra days yet.</p>
          ) : (
            <ShareList
              rows={growth.sellers.map((s) => ({
                key: s.name,
                label: s.name,
                value: s.units,
                display: `${s.units} · ${formatGhs(s.revenue)}`,
              }))}
            />
          )}
        </AdminSection>
        <AdminSection title="Where paid orders came from" hint="Region written at checkout. Empty region falls back to city.">
          {growth.regions.length === 0 ? (
            <p className="text-sm text-muted">No paid addresses in the last 30 Accra days yet.</p>
          ) : (
            <ShareList
              rows={growth.regions.map((r) => ({
                key: r.label,
                label: r.label,
                value: r.orders,
                display: `${r.orders} · ${formatGhs(r.revenue)}`,
              }))}
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
          <VisitCompare
            rows={growth.days.map((d) => ({
              key: d.day,
              label: accraDayLabel(d.day),
              views: growth.visitDays.find((v) => v.day === d.day)?.views ?? 0,
              paid: d.paidOrders,
            }))}
          />
        </AdminSection>
      ) : null}
    </div>
  );
}
