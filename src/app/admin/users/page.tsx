import { requirePermission } from "@/server/auth/authorize";
import { createAdminUser } from "@/server/auth/login";
import { listAdminUsers } from "@/server/reporting/service";
import type { RoleSlug } from "@/server/auth/types";
import { revalidatePath } from "next/cache";
import { adminButton, AdminPageHeader, AdminTable, StatusPill } from "@/components/admin/ui";

async function addUser(formData: FormData) {
  "use server";
  await requirePermission("users.write");
  await createAdminUser({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    fullName: String(formData.get("fullName")),
    roles: [String(formData.get("role")) as RoleSlug],
  });
  revalidatePath("/admin/users");
}

export default async function UsersPage() {
  await requirePermission("users.write");
  const users = await listAdminUsers();
  return (
    <div>
      <AdminPageHeader title="Staff" description="Accounts that can open this desk. Super administrators only." />
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
      <form action={addUser} className="mt-8 max-w-md space-y-3 rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Invite staff</h2>
        <label className="block text-sm">
          Name
          <input name="fullName" required className="input mt-1" />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="input mt-1" />
        </label>
        <label className="block text-sm">
          Password (12+ characters)
          <input name="password" type="password" required minLength={12} className="input mt-1" />
        </label>
        <label className="block text-sm">
          Role
          <select name="role" className="input mt-1">
            <option value="store_admin">Store administrator</option>
            <option value="inventory_manager">Inventory manager</option>
            <option value="order_manager">Order manager</option>
            <option value="super_admin">Super administrator</option>
          </select>
        </label>
        <button className={adminButton()} type="submit">
          Create
        </button>
      </form>
    </div>
  );
}
