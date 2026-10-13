"use server";

import { cookies, headers } from "next/headers";
import { authenticateCustomer, registerCustomer } from "@/server/customers/auth";
import {
  CUSTOMER_COOKIE,
  clearCustomerCookie,
  destroyCustomerSession,
  setCustomerCookie,
} from "@/server/customers/session";
import { clientIp } from "@/server/http/client-ip";

async function requestMeta() {
  const h = await headers();
  return {
    ip: clientIp(h),
    userAgent: h.get("user-agent"),
  };
}

export async function customerLogin(formData: FormData) {
  const meta = await requestMeta();
  const result = await authenticateCustomer({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  if (!result.ok) return result;
  await setCustomerCookie(result.token);
  return { ok: true as const };
}

export async function customerRegister(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) return { ok: false as const, error: "Passwords do not match." };
  const meta = await requestMeta();
  const result = await registerCustomer({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  if (!result.ok) return result;
  await setCustomerCookie(result.token);
  return { ok: true as const };
}

export async function customerLogout() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await destroyCustomerSession(token);
  await clearCustomerCookie();
}
