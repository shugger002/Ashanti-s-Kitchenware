import { requirePermission } from "@/server/auth/authorize";
import { AdminPageHeader, BackLink } from "@/components/admin/ui";
import { InviteStaffForm } from "@/app/admin/users/invite-form";

export default async function AddUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("users.write");
  const { error } = await searchParams;
  return (
    <div>
      <BackLink href="/admin/users">On the desk</BackLink>
      <AdminPageHeader title="Add staff" description="Give a staff member a login for this desk." />
      <div className="mt-8">
        <InviteStaffForm error={error} />
      </div>
    </div>
  );
}
