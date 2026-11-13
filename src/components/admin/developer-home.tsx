import Link from "next/link";
import { hasPermission, isDeveloper, type AdminUser } from "@/server/auth/types";
import { adminButton, AdminPageHeader, AdminSection } from "@/components/admin/ui";

export function DeveloperHome({ user }: { user: AdminUser }) {
  const developer = isDeveloper(user.roles);
  return (
    <div>
      <AdminPageHeader
        title={developer ? "Developer desk" : "Desk"}
        description={
          developer
            ? `${user.email} is signed in. Shop orders and catalogue stay on the staff desk.`
            : `${user.email} is signed in, but this login has no shop pages.`
        }
      />
      {developer || hasPermission(user.roles, "ops.write") ? (
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
      ) : (
        <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
          Ask a shop owner to attach a staff role if you need orders or catalogue. Sign out from the menu if this is the wrong login.
        </p>
      )}
    </div>
  );
}
