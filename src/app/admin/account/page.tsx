import { requireUser } from "@/server/auth/authorize";
import { AdminPageHeader } from "@/components/admin/ui";
import { ChangePasswordForm } from "@/app/admin/account/form";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div>
      <AdminPageHeader title="Your login" description={user.email} />
      <div className="mt-8">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
