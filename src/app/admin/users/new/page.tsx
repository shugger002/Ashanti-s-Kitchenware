import { requirePermission } from "@/server/auth/authorize";
import { AdminPageHeader, BackLink } from "@/components/admin/ui";
import { InviteStaffForm } from "@/app/admin/users/invite-form";

export default async function AddUsersPage() {
  await requirePermission("users.write");
  return (
    <div>
      <BackLink href="/admin/users">All users</BackLink>
      <AdminPageHeader
        title="Add users"
        description="Create a staff account that can open this desk. Super administrators only."
      />
      <div className="mt-8">
        <InviteStaffForm />
      </div>
    </div>
  );
}
