import { redirect } from "next/navigation";
import { readSessionUser } from "@/server/auth/session";
import {
  hasPermission,
  type AdminUser,
  type Permission,
} from "@/server/auth/types";

export async function requireUser(): Promise<AdminUser> {
  const user = await readSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requirePermission(permission: Permission): Promise<AdminUser> {
  const user = await requireUser();
  if (!hasPermission(user.roles, permission)) {
    redirect("/admin");
  }
  return user;
}

export function assertPermission(user: AdminUser, permission: Permission): void {
  if (!hasPermission(user.roles, permission)) {
    throw new Error("Forbidden");
  }
}
