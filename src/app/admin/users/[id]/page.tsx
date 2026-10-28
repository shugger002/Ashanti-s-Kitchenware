import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { canShowBlock, getStaffById } from "@/server/auth/staff";
import { setStaffActiveAction, setStaffPasswordAction, setStaffRoleAction } from "@/app/admin/users/actions";
import {
  adminButton,
  AdminPageHeader,
  AdminSection,
  BackLink,
  staffJobLabel,
  StatusPill,
} from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

export default async function StaffTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("users.write");
  const { id } = await params;
  const person = await getStaffById(id);
  if (!person) notFound();
  const canBlock = await canShowBlock(person, actor.id);
  const currentRole = person.roles[0] ?? "order_manager";

  return (
    <div className="space-y-6">
      <BackLink href="/admin/users">On the desk</BackLink>
      <AdminPageHeader
        title={person.fullName}
        description={person.email}
        action={
          <StatusPill value={person.isActive ? "Can sign in" : "Blocked"} tone={person.isActive ? "ok" : "muted"} />
        }
      />
      <div className="flex max-w-xl flex-col gap-2">
        <a href={`mailto:${person.email}`} className={adminButton()}>
          Email
        </a>
        {canBlock ? (
          <form action={setStaffActiveAction}>
            <input type="hidden" name="userId" value={person.id} />
            <input type="hidden" name="active" value={person.isActive ? "false" : "true"} />
            <button type="submit" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
              {person.isActive ? "Block" : "Allow"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted">
            {person.id === actor.id
              ? "You cannot block your own login."
              : "Keep at least one store owner who can sign in."}
          </p>
        )}
      </div>

      <form action={setStaffRoleAction} className="max-w-xl">
        <AdminSection title="Job" hint={`Now: ${person.roles.map(staffJobLabel).join(", ") || "none"}`}>
          <input type="hidden" name="userId" value={person.id} />
          <label className="block text-sm">
            Job
            <select name="role" defaultValue={currentRole} className="input mt-1">
              <option value="store_admin">Runs the shop desk</option>
              <option value="inventory_manager">Looks after stock</option>
              <option value="order_manager">Looks after orders</option>
              <option value="super_admin">Store owner (full access)</option>
            </select>
          </label>
          <button className={`${adminButton()} mt-4`} type="submit">
            Save job
          </button>
        </AdminSection>
      </form>

      <form action={setStaffPasswordAction} className="max-w-xl">
        <AdminSection title="New password" hint="At least 12 characters. This signs them out of other devices.">
          <input type="hidden" name="userId" value={person.id} />
          <label className="block text-sm">
            Password
            <input name="password" type="password" required minLength={12} className="input mt-1" />
          </label>
          <button className={`${adminButton()} mt-4`} type="submit">
            Set password
          </button>
        </AdminSection>
      </form>
    </div>
  );
}
