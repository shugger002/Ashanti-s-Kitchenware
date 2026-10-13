"use server";

import { completePasswordReset } from "@/server/auth/password-reset";

export async function submitNewPassword(formData: FormData) {
  return completePasswordReset({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
}
