"use server";

import { headers } from "next/headers";
import { requestPasswordReset } from "@/server/auth/password-reset";
import { clientIp } from "@/server/http/client-ip";

export async function submitForgotPassword(formData: FormData) {
  await requestPasswordReset(String(formData.get("email") ?? ""), clientIp(await headers()));
  return { ok: true as const };
}
