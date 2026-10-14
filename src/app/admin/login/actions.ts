"use server";

import { headers } from "next/headers";
import { authenticateAdmin } from "@/server/auth/login";
import { setSessionCookie } from "@/server/auth/session";
import { clientIp } from "@/server/http/client-ip";

export async function adminLogin(formData: FormData) {
  const h = await headers();
  const result = await authenticateAdmin({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    ip: clientIp(h),
    userAgent: h.get("user-agent"),
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  await setSessionCookie(result.token);
  return { ok: true as const };
}
