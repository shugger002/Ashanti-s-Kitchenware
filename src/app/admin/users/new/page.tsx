import { requirePermission } from "@/server/auth/authorize";
import { AdminPageHeader, BackLink } from "@/components/admin/ui";
import { InviteStaffForm } from "@/app/admin/users/invite-form";

export default async function AddUsersPage() {
  await requirePermission("users.write");
  return (
    <div>
      <BackLink href="/admin/users">All staff</BackLink>
      <AdminPageHeader
        title="Add staff"
        description="Give a staff member a login for this desk."
      />
      <div className="mt-8">
        <InviteStaffForm />
      </div>
    </div>
  );
}
