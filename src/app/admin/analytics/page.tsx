import { requirePermission } from "@/server/auth/authorize";
import { dashboardMetrics, listAuditLogs } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { AdminPageHeader, AdminTable, EmptyState, MobileCards } from "@/components/admin/ui";

export default async function AnalyticsPage() {
  const [, metrics, logs] = await Promise.all([
    requirePermission("reports.read"),
    dashboardMetrics(),
    listAuditLogs(),
  ]);
  const totalProducts = Number(metrics.total_products);
  const promo = Number(metrics.promoListings);
  const coverage = totalProducts > 0 ? Math.round((promo / totalProducts) * 100) : 0;
  const stockRisk = Number(metrics.lowStock) + Number(metrics.outOfStock);

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Money in, how many pieces are on promo, and what is running low. From this shop’s own orders."
      />
      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Total Orders</dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums">{metrics.total_orders}</dd>
          <p className="mt-2 text-xs text-muted">Pending: {metrics.pending_orders}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Paid Revenue</dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums">{formatGhs(Number(metrics.revenue))}</dd>
          <p className="mt-2 text-xs text-muted">Paid, not cancelled</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Discount Coverage</dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums">{coverage}%</dd>
          <p className="mt-2 text-xs text-muted">
            {promo}/{totalProducts} products discounted
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Stock Risk</dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums">{stockRisk}</dd>
          <p className="mt-2 text-xs text-muted">
            Low: {metrics.lowStock} · Out: {metrics.outOfStock}
          </p>
        </div>
      </dl>
      <h2 className="mt-10 text-lg font-medium">Desk activity</h2>
      {logs.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Quiet desk" body="Staff actions (product edits, stock counts, order moves) appear here." />
        </div>
      ) : (
        <>
        <MobileCards>
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-border bg-white/95 p-4 shadow-sm">
              <p className="text-xs text-muted">{new Date(log.created_at).toLocaleString("en-GH")}</p>
              <p className="mt-1 font-medium">{log.action}</p>
              <p className="mt-1 text-sm text-muted">{log.actor_email ?? "system"}</p>
              <p className="mt-1 text-xs text-muted">
                {log.entity_type}
                {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
              </p>
            </li>
          ))}
        </MobileCards>
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
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3 text-muted">{new Date(log.created_at).toLocaleString("en-GH")}</td>
                <td className="px-4 py-3">{log.actor_email ?? "system"}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3 text-muted">
                  {log.entity_type}
                  {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        </>
      )}
    </div>
  );
}
