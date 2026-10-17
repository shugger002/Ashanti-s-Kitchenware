import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listAdminUsers } from "@/server/reporting/service";
import { adminButton, AdminPageHeader, AdminTable, MobileCards, staffJobLabel, StatusPill } from "@/components/admin/ui";

export default async function UsersPage() {
  const [, users] = await Promise.all([requirePermission("users.write"), listAdminUsers()]);
  return (
    <div>
      <AdminPageHeader
        title="Staff"
        description="People who can open this desk. Only the store owner can add or change them."
        action={
          <Link href="/admin/users/new" className={adminButton()}>
            Add staff
          </Link>
        }
      />
      <MobileCards className="mt-6">
        {users.map((u) => (
          <li key={u.id} className="admin-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{u.full_name}</p>
              <StatusPill value={u.is_active ? "Can sign in" : "Blocked"} tone={u.is_active ? "ok" : "muted"} />
            </div>
            <a href={`mailto:${u.email}`} className="mt-2 block min-h-11 text-sm text-accent">
              {u.email}
            </a>
            <p className="text-xs text-muted">{(u.roles ?? []).map(staffJobLabel).join(", ") || "-"}</p>
          </li>
        ))}
      </MobileCards>
      <AdminTable className="mt-6">
        <thead>
          <tr className="border-b border-border bg-surface text-xs text-muted">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Job</th>
            <th className="px-4 py-3 font-medium">Sign in</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface">
              <td className="px-4 py-3 font-medium">{u.full_name}</td>
              <td className="px-4 py-3">
                <a href={`mailto:${u.email}`} className="text-accent">
                  {u.email}
                </a>
              </td>
              <td className="px-4 py-3">{(u.roles ?? []).map(staffJobLabel).join(", ") || "-"}</td>
              <td className="px-4 py-3">
                <StatusPill value={u.is_active ? "Can sign in" : "Blocked"} tone={u.is_active ? "ok" : "muted"} />
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
