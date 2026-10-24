import { requirePermission } from "@/server/auth/authorize";
import { dashboardMetrics, listAuditLogs } from "@/server/reporting/service";
import { storeVisitSummary } from "@/server/analytics/page-views";
import { formatGhs } from "@/lib/money";
import { AdminGlance, AdminPageHeader, AdminSection, AdminTable, deskActionLabel, MobileCards } from "@/components/admin/ui";
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
      <AdminGlance
        items={[
          { label: "Visits today", value: visits.todayViews },
          { label: "Last 7 days", value: visits.weekViews },
          { href: "/admin/orders", label: "Orders", value: metrics.total_orders },
          { label: "Paid sales", value: formatGhs(Number(metrics.revenue)) },
          { href: "/admin/promotions", label: "On sale", value: `${coverage}%` },
          { href: "/admin/inventory", label: "Need restock", value: stockRisk, warn: stockRisk > 0 },
        ]}
      />
      <p className="mt-2 text-xs text-muted">
        {visits.todayVisitors} people today · {visits.weekVisitors} this week
        {promo ? ` · ${promo} of ${totalProducts} on promo` : ""}
        {stockRisk > 0 ? ` · low ${metrics.lowStock}, finished ${metrics.outOfStock}` : ""}
      </p>
      {visits.topPaths.length > 0 ? (
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
      )}
      <AdminSection className="mt-8" title="What staff did">
      {logs.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted">
          When someone edits a product, counts stock, or moves an order, it shows here.
        </p>
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
      </AdminSection>
    </div>
  );
}
