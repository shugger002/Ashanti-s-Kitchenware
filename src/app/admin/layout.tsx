import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { readSessionUser } from "@/server/auth/session";

async function AdminSessionGate({ children }: { children: React.ReactNode }) {
  const user = await readSessionUser();
  return user ? <AdminShell user={user}>{children}</AdminShell> : children;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-desk">
      <Suspense fallback={children}>
        <AdminSessionGate>{children}</AdminSessionGate>
      </Suspense>
    </div>
  );
}
