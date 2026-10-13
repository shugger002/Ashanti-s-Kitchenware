import { AdminShell } from "@/components/admin/shell";
import { readSessionUser } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await readSessionUser();
  if (!user) return children;
  return <AdminShell user={user}>{children}</AdminShell>;
}
