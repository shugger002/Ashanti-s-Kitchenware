"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/authorize";
import { createAdminUser } from "@/server/auth/login";
import type { RoleSlug } from "@/server/auth/types";

export async function addStaffUser(formData: FormData) {
  await requirePermission("users.write");
  await createAdminUser({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    fullName: String(formData.get("fullName")),
    roles: [String(formData.get("role")) as RoleSlug],
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/users/new");
}
