import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listAdminUsers } from "@/server/reporting/service";
import { adminButton, AdminPageHeader, AdminTable, StatusPill } from "@/components/admin/ui";

export default async function UsersPage() {
  const [, users] = await Promise.all([requirePermission("users.write"), listAdminUsers()]);
  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Accounts that can open this desk. Super administrators only."
        action={
          <Link href="/admin/users/new" className={adminButton()}>
            Add users
          </Link>
        }
      />
      <AdminTable className="mt-6">
        <thead>
          <tr className="border-b border-border bg-surface text-xs text-muted">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Roles</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface">
              <td className="px-4 py-3 font-medium">{u.full_name}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">{(u.roles ?? []).join(", ") || "—"}</td>
              <td className="px-4 py-3">
                <StatusPill value={u.is_active ? "Active" : "Disabled"} tone={u.is_active ? "ok" : "muted"} />
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
