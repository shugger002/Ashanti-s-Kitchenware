"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateAdmin } from "@/server/auth/login";
import { setSessionCookie } from "@/server/auth/session";
import { clientIp } from "@/server/http/client-ip";

export type AdminLoginState = { error?: string; email?: string } | null;

function isNextRedirect(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT"),
  );
}

export async function adminLogin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "");
  try {
    const h = await headers();
    const result = await authenticateAdmin({
      email,
      password: String(formData.get("password") ?? ""),
      ip: clientIp(h),
      userAgent: h.get("user-agent"),
    });
    if (!result.ok) return { error: result.error, email };
    await setSessionCookie(result.token);
    redirect("/admin");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("adminLogin failed", error);
    return { error: "Could not sign in just now. Try again.", email };
  }
}
