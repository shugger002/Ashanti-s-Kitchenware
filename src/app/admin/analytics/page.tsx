import { requirePermission } from "@/server/auth/authorize";
import { dashboardMetrics, listAuditLogs } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { AdminPageHeader, AdminTable, EmptyState } from "@/components/admin/ui";

export default async function AnalyticsPage() {
  await requirePermission("reports.read");
  const [metrics, logs] = await Promise.all([dashboardMetrics(), listAuditLogs()]);
  const totalProducts = Number(metrics.total_products);
  const promo = Number(metrics.promoListings);
  const coverage = totalProducts > 0 ? Math.round((promo / totalProducts) * 100) : 0;
  const stockRisk = Number(metrics.lowStock) + Number(metrics.outOfStock);

  return (
    <div>
      <AdminPageHeader
        title="Analytics Dashboard"
        description="Paid revenue, discount coverage, and stock risk from this shop's own orders."
      />
      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Total Orders</dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums">{metrics.total_orders}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Paid Revenue</dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums">{formatGhs(Number(metrics.revenue))}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Discount Coverage</dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums">{coverage}%</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Stock Risk</dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums">{stockRisk}</dd>
        </div>
      </dl>
      <h2 className="mt-10 text-lg font-medium">Desk activity</h2>
      {logs.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Quiet desk" body="Staff actions appear here." />
        </div>
      ) : (
        <AdminTable className="mt-4">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Staff</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Record</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">{new Date(log.created_at).toLocaleString("en-GH")}</td>
                <td className="px-4 py-3">{log.actor_email ?? "system"}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3 text-muted">{log.entity_type}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
