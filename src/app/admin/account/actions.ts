"use server";

import { cookies } from "next/headers";
import { requireUser } from "@/server/auth/authorize";
import { changeOwnPassword } from "@/server/auth/account";
import { getSessionCookieName } from "@/server/env";

export type AccountPasswordState = { error?: string; notice?: string } | null;

export async function changeAccountPassword(
  _prev: AccountPasswordState,
  formData: FormData,
): Promise<AccountPasswordState> {
  const user = await requireUser();
  const token = (await cookies()).get(getSessionCookieName())?.value ?? null;
  const result = await changeOwnPassword({
    userId: user.id,
    currentPassword: String(formData.get("currentPassword") ?? ""),
    nextPassword: String(formData.get("nextPassword") ?? ""),
    sessionToken: token,
  });
  if (!result.ok) return { error: result.error };
  return { notice: "Password saved. Other devices will need to sign in again." };
}
