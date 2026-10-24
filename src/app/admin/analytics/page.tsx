import { requirePermission } from "@/server/auth/authorize";
import { dashboardMetrics, listAuditLogs } from "@/server/reporting/service";
import { storeVisitSummary } from "@/server/analytics/page-views";
import { formatGhs } from "@/lib/money";
import { AdminPageHeader, AdminStat, AdminTable, deskActionLabel, EmptyState, MobileCards } from "@/components/admin/ui";
import { getAnalyticsMeasurementId } from "@/server/env";

export default async function AnalyticsPage() {
  const [, metrics, logs, visits] = await Promise.all([
    requirePermission("reports.read"),
    dashboardMetrics(),
    listAuditLogs(),
    storeVisitSummary(),
  ]);
  const totalProducts = Number(metrics.total_products);
  const promo = Number(metrics.promoListings);
  const coverage = totalProducts > 0 ? Math.round((promo / totalProducts) * 100) : 0;
  const stockRisk = Number(metrics.lowStock) + Number(metrics.outOfStock);

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Shop visits after someone accepts cookies, plus paid orders and stock from this desk."
      />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li>
          <AdminStat label="Visits today" value={visits.todayViews} hint={`${visits.todayVisitors} people`} />
        </li>
        <li>
          <AdminStat label="Last 7 days" value={visits.weekViews} hint={`${visits.weekVisitors} people`} />
        </li>
        <li>
          <AdminStat label="Orders" value={metrics.total_orders} hint={`Waiting for payment: ${metrics.pending_orders}`} />
        </li>
        <li>
          <AdminStat label="Paid sales" value={formatGhs(Number(metrics.revenue))} hint="Paid orders only" />
        </li>
        <li>
          <AdminStat label="On sale" value={`${coverage}%`} hint={`${promo} of ${totalProducts} products`} />
        </li>
        <li>
          <AdminStat
            label="Need restock"
            value={stockRisk}
            hint={`Low: ${metrics.lowStock} · Finished: ${metrics.outOfStock}`}
            warn={stockRisk > 0}
          />
        </li>
      </ul>
      {visits.topPaths.length > 0 ? (
        <>
          <h2 className="mt-10 text-lg font-medium">Pages this week</h2>
          <ul className="admin-panel admin-panel-flush mt-4 divide-y divide-border overflow-hidden">
            {visits.topPaths.map((row) => (
              <li key={row.path} className="flex min-h-12 items-center justify-between gap-4 px-5 py-3 text-sm">
                <span className="truncate">{row.path}</span>
                <span className="tabular-nums text-muted">{row.views}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-8 text-sm text-muted">
          Visit counts start after a shopper taps Accept all on the cookie bar.
          {getAnalyticsMeasurementId() ? " Google Analytics is also on for those visits." : ""}
        </p>
      )}
      <h2 className="mt-10 text-lg font-medium">What staff did</h2>
      {logs.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Nothing logged yet" body="When someone edits a product, counts stock, or moves an order, it shows here." />
        </div>
      ) : (
        <>
        <MobileCards>
          {logs.map((log) => (
            <li key={log.id} className="admin-panel p-4">
              <p className="text-xs text-muted">{new Date(log.created_at).toLocaleString("en-GH")}</p>
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
                <td className="px-4 py-3 text-muted">{new Date(log.created_at).toLocaleString("en-GH")}</td>
                <td className="px-4 py-3">{log.actor_email ?? "System"}</td>
                <td className="px-4 py-3">{deskActionLabel(log.action)}</td>
                <td className="px-4 py-3 text-muted capitalize">{log.entity_type.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        </>
      )}
    </div>
  );
}
