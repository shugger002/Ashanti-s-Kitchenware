import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import AdminLoading from "@/app/admin/loading";
import { readSessionUser } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await readSessionUser();
  const page = <Suspense fallback={<AdminLoading />}>{children}</Suspense>;
  return (
    <div className="admin-desk">
      {user ? <AdminShell user={user}>{page}</AdminShell> : page}
    </div>
  );
}
