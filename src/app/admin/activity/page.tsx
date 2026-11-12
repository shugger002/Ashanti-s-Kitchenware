import { requirePermission } from "@/server/auth/authorize";
import { listAdminActivity } from "@/server/ops/audit";
import { formatAccraWhen } from "@/lib/accra-time";
import { AdminPageHeader, AdminSection, EmptyState, StatusPill } from "@/components/admin/ui";

function actionLabel(action: string) {
  return action.replaceAll(".", " · ").replaceAll("_", " ");
}

export default async function ActivityPage() {
  await requirePermission("ops.write");
  let rows: Awaited<ReturnType<typeof listAdminActivity>> = [];
  let failed = false;
  try {
    rows = await listAdminActivity(60);
  } catch {
    failed = true;
  }

  return (
    <div>
      <AdminPageHeader
        title="Activity"
        description="Who changed products, stock, orders, settings, and operations. Secrets are stripped from this log."
      />
      <AdminSection className="mt-8" title="Recent desk actions">
        {failed ? (
          <p className="text-sm text-accent">The activity log could not load.</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No activity yet" body="Staff actions on this desk will list here." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{actionLabel(row.action)}</p>
                  <p className="mt-1 text-sm text-muted">
                    {row.actor}
                    {row.entityType ? ` · ${row.entityType}` : ""}
                    {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">{formatAccraWhen(row.createdAt)}</p>
                </div>
                <StatusPill value={row.ok ? "Recorded" : "Failed"} tone={row.ok ? "ok" : "danger"} />
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </div>
  );
}
