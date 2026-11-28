import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/shell";
import { requireUser } from "@/server/auth/authorize";
import { readSessionUser } from "@/server/auth/session";

export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AK Desk",
    statusBarStyle: "default",
  },
};

const PUBLIC_DESK = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (!PUBLIC_DESK.has(pathname)) {
    const user = await requireUser();
    return (
      <div className="admin-desk">
        <AdminShell user={user}>{children}</AdminShell>
      </div>
    );
  }
  const user = await readSessionUser();
  return (
    <div className="admin-desk">
      {user ? <AdminShell user={user}>{children}</AdminShell> : children}
    </div>
  );
}
