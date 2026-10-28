import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import {
  countAnalyticsGlance,
  listAuditLogs,
  listBestSellers,
  listPaidOrders,
  type AnalyticsPeriod,
} from "@/server/reporting/service";
import { storeVisitSummary } from "@/server/analytics/page-views";
import { formatGhs } from "@/lib/money";
import { formatAccraWhen } from "@/lib/accra-time";
import { AnalyticsOrderCard } from "@/components/admin/analytics-order-card";
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

type AnalyticsNeed = "today" | "week" | "sold" | "staff";

function parseNeed(value?: string): AnalyticsNeed {
  return value === "week" || value === "sold" || value === "staff" || value === "today" ? value : "today";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const params = await searchParams;
  const need = parseNeed(params.need);
  const period: AnalyticsPeriod = need === "week" ? "week" : "today";
  const soldPeriod: AnalyticsPeriod = need === "week" ? "week" : "today";
  const [, glance, visits, orders, sold, logs] = await Promise.all([
    requirePermission("reports.read"),
    countAnalyticsGlance(),
    storeVisitSummary(),
    need === "sold" || need === "staff" ? Promise.resolve([]) : listPaidOrders(period),
    need === "sold" ? listBestSellers(soldPeriod) : Promise.resolve([]),
    need === "staff" ? listAuditLogs() : Promise.resolve([]),
  ]);
  const chips: { href: string; label: string; active: boolean }[] = [
    { href: "/admin/analytics", label: "Today", active: need === "today" },
    { href: "/admin/analytics?need=week", label: "Last 7 days", active: need === "week" },
    { href: "/admin/analytics?need=sold", label: "What sold", active: need === "sold" },
    { href: "/admin/analytics?need=staff", label: "Staff did", active: need === "staff" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Accra time. Paid today is money taken today, not delivery at checkout. Visits count after a shopper taps Accept all."
      />
      <AdminGlance
        items={[
          { href: "/admin/analytics", label: "Paid today", value: formatGhs(Number(glance.paidToday)) },
          { href: "/admin/analytics", label: "Orders today", value: glance.ordersToday },
          { href: "/admin/orders?need=done", label: "Delivered today", value: glance.deliveredToday },
          { href: "/admin/analytics", label: "Visits today", value: visits.todayViews },
        ]}
      />
      <p className="mt-2 text-xs text-muted">
        {visits.todayVisitors} people today · {visits.weekVisitors} this week · paid overall {formatGhs(Number(glance.paidAll))}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
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

      {need === "sold" ? (
        sold.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Nothing sold in this Accra day yet" body="Paid pieces show here. Lifetime best sellers stay on Home." />
          </div>
        ) : (
          <AdminSection className="mt-6" title="What sold today" hint="Paid orders, Accra time. Delivery is not in these Cedis.">
            <ul className="divide-y divide-border">
              {sold.map((row) => (
                <li key={row.product_name} className="flex items-baseline justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">{row.product_name}</span>
                  <span className="shrink-0 font-serif tabular-nums">
                    {row.units} · {formatGhs(Number(row.revenue))}
                  </span>
                </li>
              ))}
            </ul>
          </AdminSection>
        )
      ) : null}

      {need === "staff" ? (
        logs.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No staff actions yet" body="When someone edits a product, counts stock, or moves an order, it shows here." />
          </div>
        ) : (
          <AdminSection className="mt-6" title="What staff did">
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
        )
      ) : null}

      {need === "today" || need === "week" ? (
        <>
          {orders.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title={need === "week" ? "No paid orders in the last 7 Accra days" : "No paid orders today"}
                body="When a payment is marked paid, the ticket shows here."
              />
            </div>
          ) : (
            <>
              <ul className="mt-4 space-y-3 md:hidden">
                {orders.map((order) => (
                  <li key={order.id}>
                    <AnalyticsOrderCard order={order} />
                  </li>
                ))}
              </ul>
              <AdminTable className="mt-4">
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
            </>
          )}
          {need === "today" ? (
            visits.topPaths.length > 0 ? (
              <AdminSection className="mt-8" title="Pages this week">
                <ul className="-mx-1 divide-y divide-border">
                  {visits.topPaths.map((row) => (
                    <li key={row.path} className="flex min-h-12 items-center justify-between gap-4 px-5 py-3 text-sm">
                      <span className="truncate">{row.path}</span>
                      <span className="tabular-nums text-muted">{row.views}</span>
                    </li>
                  ))}
                </ul>
              </AdminSection>
            ) : (
              <p className="mt-8 text-sm text-muted">
                Visit counts start after a shopper taps Accept all on the cookie bar.
                {getAnalyticsMeasurementId() ? " Google Analytics is also on for those visits." : ""}
              </p>
            )
          ) : null}
        </>
      ) : null}
    </div>
  );
}
