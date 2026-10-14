"use server";

import { cookies } from "next/headers";
import { destroySession, clearSessionCookie } from "@/server/auth/session";
import { getSessionCookieName } from "@/server/env";

export async function logoutAdmin() {
  const jar = await cookies();
  const token = jar.get(getSessionCookieName())?.value;
  if (token) await destroySession(token);
  await clearSessionCookie();
}
