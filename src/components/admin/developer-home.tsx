import Link from "next/link";
import type { AdminUser } from "@/server/auth/types";
import { adminButton, AdminPageHeader, AdminSection } from "@/components/admin/ui";

export function DeveloperHome({ user }: { user: AdminUser }) {
  return (
    <div>
      <AdminPageHeader
        title="Developer desk"
        description={`${user.email} is signed in as developer. Shop staff do not see this section.`}
      />
      <AdminSection className="mt-8 max-w-xl" title="Open">
        <div className="flex flex-col gap-2">
          <Link href="/admin/ops" className={adminButton()}>
            Operations
          </Link>
          <Link href="/admin/services" className={adminButton()}>
            Connections
          </Link>
          <Link href="/admin/activity" className={adminButton()}>
            Activity
          </Link>
        </div>
      </AdminSection>
    </div>
  );
}
