"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { createAdminUser } from "@/server/auth/login";
import { ROLE_SLUGS, type RoleSlug } from "@/server/auth/types";
import { setStaffActive, setStaffPassword, setStaffRole } from "@/server/auth/staff";

function touchStaff(userId?: string) {
  revalidatePath("/admin/users");
  revalidatePath("/admin/users/new");
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

function parseRole(value: FormDataEntryValue | null): RoleSlug {
  const role = String(value ?? "");
  if (!(ROLE_SLUGS as readonly string[]).includes(role)) {
    throw new Error("Unknown job");
  }
  return role as RoleSlug;
}

export async function addStaffUser(formData: FormData) {
  await requirePermission("users.write");
  try {
    await createAdminUser({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      fullName: String(formData.get("fullName")),
      roles: [parseRole(formData.get("role"))],
    });
  } catch (error) {
    const rec = error && typeof error === "object" ? (error as { name?: string; code?: string }) : {};
    if (rec.name === "DuplicateStaffEmailError" || rec.code === "23505") {
      redirect("/admin/users/new?error=email");
    }
    throw error;
  }
  touchStaff();
  redirect("/admin/users");
}

export async function setStaffActiveAction(formData: FormData) {
  const actor = await requirePermission("users.write");
  const userId = String(formData.get("userId"));
  await setStaffActive({
    userId,
    actorUserId: actor.id,
    isActive: String(formData.get("active")) === "true",
  });
  touchStaff(userId);
}

export async function setStaffRoleAction(formData: FormData) {
  const actor = await requirePermission("users.write");
  const userId = String(formData.get("userId"));
  await setStaffRole({
    userId,
    actorUserId: actor.id,
    role: parseRole(formData.get("role")),
  });
  touchStaff(userId);
}

export async function setStaffPasswordAction(formData: FormData) {
  const actor = await requirePermission("users.write");
  const userId = String(formData.get("userId"));
  await setStaffPassword({
    userId,
    actorUserId: actor.id,
    password: String(formData.get("password")),
  });
  touchStaff(userId);
}
