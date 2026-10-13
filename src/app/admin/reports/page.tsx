import { requirePermission } from "@/server/auth/authorize";
import { dashboardMetrics, listAuditLogs } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { AdminPageHeader, AdminTable, EmptyState } from "@/components/admin/ui";

export default async function ReportsPage() {
  await requirePermission("reports.read");
  const [metrics, logs] = await Promise.all([dashboardMetrics(), listAuditLogs()]);
  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Revenue counts only paid orders that are not cancelled or refunded."
      />
      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5">
          <dt className="text-xs text-muted">Paid revenue</dt>
          <dd className="mt-2 font-serif text-2xl tabular-nums">{formatGhs(Number(metrics.revenue))}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <dt className="text-xs text-muted">Paid orders</dt>
          <dd className="mt-2 font-serif text-2xl tabular-nums">{metrics.paid_orders}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <dt className="text-xs text-muted">Average paid order</dt>
          <dd className="mt-2 font-serif text-2xl tabular-nums">{formatGhs(Number(metrics.aov))}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <dt className="text-xs text-muted">Ready to pack</dt>
          <dd className="mt-2 font-serif text-2xl tabular-nums">{metrics.ready_to_pack}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <dt className="text-xs text-muted">Packaging / out</dt>
          <dd className="mt-2 font-serif text-2xl tabular-nums">
            {metrics.packing_orders} · {metrics.out_for_delivery}
          </dd>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <dt className="text-xs text-muted">Demo SKUs</dt>
          <dd className="mt-2 font-serif text-2xl tabular-nums">{metrics.demoListings}</dd>
        </div>
      </dl>
      <h2 className="mt-10 font-serif text-xl">Audit log</h2>
      {logs.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Quiet desk" body="Staff actions — product edits, stock counts, order moves — appear here." />
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
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3 text-muted">
                  {new Date(log.created_at).toLocaleString("en-GH")}
                </td>
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
      )}
    </div>
  );
}
