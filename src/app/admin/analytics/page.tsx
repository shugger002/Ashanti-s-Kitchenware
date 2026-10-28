import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listAuditLogs, listPaidOrders, type AnalyticsPeriod } from "@/server/reporting/service";
import {
  analyticsMoney,
  analyticsSold,
  analyticsStaffCounts,
  compareLabel,
  spanLabel,
} from "@/server/reporting/analytics-detail";
import { storeVisitDetail } from "@/server/analytics/page-views";
import { formatGhs } from "@/lib/money";
import { formatAccraWhen } from "@/lib/accra-time";
import { AnalyticsOrderCard } from "@/components/admin/analytics-order-card";
import {
  accraDayLabel,
  DeskColumns,
  DeskDelta,
  MixDonut,
  paidDayColumns,
  PipelineStrip,
  ShareList,
  VisitCompare,
} from "@/components/admin/desk-charts";
import {
  AdminGlance,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  deskActionLabel,
  EmptyState,
  MobileCards,
} from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAnalyticsMeasurementId } from "@/server/env";

type AnalyticsNeed = "money" | "sold" | "shoppers" | "staff";

function parseSpan(need?: string, span?: string): AnalyticsPeriod {
  if (span === "week" || span === "month" || span === "today") return span;
  if (need === "week") return "week";
  if (need === "month") return "month";
  return "today";
}

function parseNeed(need?: string): AnalyticsNeed {
  if (need === "sold" || need === "shoppers" || need === "staff") return need;
  return "money";
}

function hrefFor(need: AnalyticsNeed, span: AnalyticsPeriod) {
  const params = new URLSearchParams();
  if (need !== "money") params.set("need", need);
  if (span !== "today") params.set("span", span);
  const q = params.toString();
  return q ? `/admin/analytics?${q}` : "/admin/analytics";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string; span?: string }>;
}) {
  const params = await searchParams;
  const span = parseSpan(params.need, params.span);
  const need = parseNeed(params.need);
  const compare = compareLabel(span);
  const when = spanLabel(span);

  const [, money, visits, orders, sold, logs, staffCounts] = await Promise.all([
    requirePermission("reports.read"),
    analyticsMoney(span),
    storeVisitDetail(span),
    need === "money" ? listPaidOrders(span) : Promise.resolve([]),
    need === "sold" ? analyticsSold(span) : Promise.resolve(null),
    need === "staff" ? listAuditLogs() : Promise.resolve([]),
    need === "staff" ? analyticsStaffCounts() : Promise.resolve([]),
  ]);

  const spanChips: { href: string; label: string; active: boolean }[] = [
    { href: hrefFor(need, "today"), label: "Today", active: span === "today" },
    { href: hrefFor(need, "week"), label: "Last 7 days", active: span === "week" },
    { href: hrefFor(need, "month"), label: "Last 30 Accra days", active: span === "month" },
  ];
  const viewChips: { href: string; label: string; active: boolean }[] = [
    { href: hrefFor("money", span), label: "Money", active: need === "money" },
    { href: hrefFor("sold", span), label: "What sold", active: need === "sold" },
    { href: hrefFor("shoppers", span), label: "Shoppers", active: need === "shoppers" },
    { href: hrefFor("staff", span), label: "Staff did", active: need === "staff" },
  ];

  const hourColumns = money.hours.map((h) => ({
    key: String(h.hour),
    value: h.paidGhs,
    bottom: String(h.hour).padStart(2, "0"),
    extra: `${formatGhs(h.paidGhs)}, ${h.paidOrders} paid`,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Accra time. Paid is money taken on the order, not a delivery charge. Visits count after a shopper taps Accept all."
      />
      <AdminGlance
        items={[
          { href: hrefFor("money", span), label: "Paid", value: formatGhs(money.paidGhs) },
          { href: hrefFor("money", span), label: "Paid orders", value: money.paidOrders },
          { href: hrefFor("money", span), label: "Typical paid ticket", value: formatGhs(money.aov) },
          { href: hrefFor("money", span), label: "Waiting unpaid", value: money.unpaid },
          { href: hrefFor("shoppers", span), label: "Visits", value: visits.views },
          { href: hrefFor("shoppers", span), label: "People", value: visits.people },
        ]}
      />
      <p className="mt-2 text-xs text-muted">
        Figures are for {when}. Waiting unpaid is tickets still not paid in this window, not lost sales.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {spanChips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              buttonClass("ghost", "h-10 min-h-10 px-3 text-sm"),
              chip.active && "bg-foreground text-background hover:bg-foreground",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {viewChips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              buttonClass("ghost", "h-10 min-h-10 px-3 text-sm"),
              chip.active && "bg-foreground text-background hover:bg-foreground",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>

      {need === "money" ? (
        <div className="mt-8 space-y-6">
          <AdminSection title={`Paid ${when}`} hint="Compared with the matching Accra window before this one. Delivery is not in these Cedis.">
            <p className="font-serif text-4xl tabular-nums">{formatGhs(money.paidGhs)}</p>
            <div className="mt-2">
              <DeskDelta current={money.paidGhs} previous={money.prevPaidGhs} unit={formatGhs(money.prevPaidGhs)} compare={compare} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Paid orders</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{money.paidOrders}</dd>
                <DeskDelta current={money.paidOrders} previous={money.prevPaidOrders} compare={compare} />
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Typical paid ticket</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{formatGhs(money.aov)}</dd>
                <DeskDelta current={money.aov} previous={money.prevAov} compare={compare} />
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Waiting unpaid</dt>
                <dd className="mt-1 font-serif text-2xl tabular-nums">{money.unpaid}</dd>
                <DeskDelta current={money.unpaid} previous={money.prevUnpaid} compare={compare} />
              </div>
            </dl>
          </AdminSection>

          {span === "today" ? (
            <AdminSection title="Paid by Accra hour" hint="Empty hours stayed empty. No invented peaks.">
              <DeskColumns
                points={hourColumns}
                ariaLabel="Paid Cedis by Accra hour today"
                emptyHint="No paid Cedis in any Accra hour today yet."
              />
            </AdminSection>
          ) : (
            <AdminSection
              title={span === "week" ? "Paid by Accra day, last 7 days" : "Paid by Accra day, last 30 days"}
              hint="Each column is that Accra day’s paid Cedis. Today is the red column on the right."
            >
              <DeskColumns
                points={paidDayColumns(money.days)}
                ariaLabel="Paid Cedis by Accra day"
                emptyHint={`No paid Cedis in ${when} yet. Delivery is not added into paid.`}
              />
            </AdminSection>
          )}

          {orders.length === 0 ? (
            <EmptyState title={`No paid orders in ${when}`} body="When a payment is marked paid, the ticket shows here." />
          ) : (
            <AdminSection title="Paid tickets" hint="Open a ticket to pack or WhatsApp. Limit 50 newest.">
              <ul className="space-y-3 md:hidden">
                {orders.map((order) => (
                  <li key={order.id}>
                    <AnalyticsOrderCard order={order} />
                  </li>
                ))}
              </ul>
              <AdminTable>
                <thead>
                  <tr className="border-b border-border bg-surface text-xs text-muted">
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface">
                      <td className="px-4 py-3 font-medium">{order.publicRef}</td>
                      <td className="px-4 py-3">
                        {order.fullName}
                        <span className="mt-0.5 block text-xs text-muted">{order.phone}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{formatAccraWhen(order.createdAt)}</td>
                      <td className="px-4 py-3 font-serif tabular-nums">{formatGhs(Number(order.total))}</td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className={buttonClass("primary", "h-11 min-h-11 px-4")}>
                          Open this order
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </AdminSection>
          )}
        </div>
      ) : null}

      {need === "sold" && sold ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <AdminSection title={`Pieces sold ${when}`} hint="Paid lines only. DEMO SKUs are blocked at checkout.">
              {sold.products.length === 0 ? (
                <p className="text-sm text-muted">No paid items in this window yet.</p>
              ) : (
                <ShareList
                  rows={sold.products.map((row) => ({
                    key: `${row.sku}-${row.name}`,
                    label: `${row.name} · ${row.sku}`,
                    value: row.units,
                    display: `${row.units} · ${formatGhs(row.revenue)}`,
                  }))}
                />
              )}
            </AdminSection>
            <AdminSection title="By aisle" hint="From the product’s category. Missing aisle is labelled honestly.">
              {sold.aisles.length === 0 ? (
                <p className="text-sm text-muted">No paid aisles in this window yet.</p>
              ) : (
                <ShareList
                  rows={sold.aisles.map((row) => ({
                    key: row.label,
                    label: row.label,
                    value: row.units,
                    display: `${row.units} · ${formatGhs(row.revenue)}`,
                  }))}
                />
              )}
            </AdminSection>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <AdminSection title="Paid ticket size" hint="Bands from the order total as paid, not a promotion.">
              <PipelineStrip items={sold.bands} />
            </AdminSection>
            <AdminSection title="Paid vs still waiting" hint="Counts of tickets created in this window. This is not a conversion rate.">
              <MixDonut
                caption="Paid versus unpaid tickets created in this window"
                slices={[
                  { label: "Paid", value: sold.paidCreated, fill: "var(--accent)" },
                  { label: "Waiting unpaid", value: sold.unpaidCreated, fill: "#3a1c1c" },
                ]}
              />
            </AdminSection>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <AdminSection title="How they take the goods" hint="Timing and charge are still quoted on WhatsApp.">
              <MixDonut
                caption="Paid delivery versus collection"
                slices={[
                  { label: "Delivery", value: sold.deliveryOrders, fill: "var(--accent)" },
                  { label: "Collect at shop", value: sold.collectionOrders, fill: "#3a1c1c" },
                ]}
              />
            </AdminSection>
            <AdminSection title="Where paid orders came from" hint="Region written at checkout, or city if region was blank.">
              {sold.regions.length === 0 ? (
                <p className="text-sm text-muted">No paid addresses in this window yet.</p>
              ) : (
                <ShareList
                  rows={sold.regions.map((row) => ({
                    key: row.label,
                    label: row.label,
                    value: row.orders,
                    display: `${row.orders} · ${formatGhs(row.revenue)}`,
                  }))}
                />
              )}
            </AdminSection>
          </div>
        </div>
      ) : null}

      {need === "shoppers" ? (
        <div className="mt-8 space-y-6">
          {visits.views === 0 ? (
            <p className="text-sm text-muted">
              Visit counts start after a shopper taps Accept all on the cookie bar.
              {getAnalyticsMeasurementId() ? " Google Analytics is also on for those visits." : ""}
            </p>
          ) : (
            <>
              <AdminSection
                title={`Shop views ${when}`}
                hint="Pale columns are page views after Accept all. Red columns are paid tickets. Interest, not a conversion rate."
              >
                <p className="text-sm text-muted">
                  {visits.views} views · {visits.people} people · {money.paidOrders} paid tickets
                </p>
                <div className="mt-4">
                  <VisitCompare
                    rows={money.days.map((d) => ({
                      key: d.day,
                      label: accraDayLabel(d.day),
                      views: visits.days.find((v) => v.day === d.day)?.views ?? 0,
                      paid: d.paidOrders,
                    }))}
                  />
                </div>
              </AdminSection>
              <div className="grid gap-6 lg:grid-cols-2">
                <AdminSection title="Pages" hint="Paths people opened on the shop in this Accra window.">
                  <ShareList
                    rows={visits.paths.map((row) => ({
                      key: row.path,
                      label: row.path,
                      value: row.views,
                      display: String(row.views),
                    }))}
                  />
                </AdminSection>
                <AdminSection title="How they arrived" hint="Hostname we stored from the referrer, or typed/unknown.">
                  <ShareList
                    rows={visits.referrers.map((row) => ({
                      key: row.host,
                      label: row.host,
                      value: row.views,
                      display: String(row.views),
                    }))}
                  />
                </AdminSection>
              </div>
            </>
          )}
        </div>
      ) : null}

      {need === "staff" ? (
        <div className="mt-8 space-y-6">
          {staffCounts.length > 0 ? (
            <AdminSection title="Staff actions, last 7 Accra days" hint="How often each desk action ran. Not a league table.">
              <ShareList
                rows={staffCounts.map((row) => ({
                  key: row.action,
                  label: deskActionLabel(row.action),
                  value: row.count,
                  display: String(row.count),
                }))}
              />
            </AdminSection>
          ) : null}
          {logs.length === 0 ? (
            <EmptyState title="No staff actions yet" body="When someone edits a product, counts stock, or moves an order, it shows here." />
          ) : (
            <AdminSection title="What staff did">
              <MobileCards className="mt-0">
                {logs.map((log) => (
                  <li key={log.id} className="admin-panel p-4">
                    <p className="text-xs text-muted">{formatAccraWhen(log.created_at)}</p>
                    <p className="mt-1 font-medium">{deskActionLabel(log.action)}</p>
                    <p className="mt-1 text-sm text-muted">{log.actor_email ?? "System"}</p>
                  </li>
                ))}
              </MobileCards>
              <AdminTable className="mt-4">
                <thead>
                  <tr className="border-b border-border bg-surface text-xs text-muted">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">What</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface">
                      <td className="px-4 py-3 text-muted">{formatAccraWhen(log.created_at)}</td>
                      <td className="px-4 py-3">{log.actor_email ?? "System"}</td>
                      <td className="px-4 py-3">{deskActionLabel(log.action)}</td>
                      <td className="px-4 py-3 text-muted capitalize">{log.entity_type.replaceAll("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </AdminSection>
          )}
        </div>
      ) : null}
    </div>
  );
}
