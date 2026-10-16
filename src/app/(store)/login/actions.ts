"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateCustomer, registerCustomer } from "@/server/customers/auth";
import {
  CUSTOMER_COOKIE,
  clearCustomerCookie,
  destroyCustomerSession,
  setCustomerCookie,
} from "@/server/customers/session";
import { clientIp } from "@/server/http/client-ip";

export type CustomerAuthState = { error: string } | null;

async function requestMeta() {
  const h = await headers();
  return {
    ip: clientIp(h),
    userAgent: h.get("user-agent"),
  };
}

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) return next;
  return "/account";
}

export async function customerLogin(_prev: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  try {
    const meta = await requestMeta();
    const result = await authenticateCustomer({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    if (!result.ok) return { error: result.error };
    await setCustomerCookie(result.token);
  } catch (error) {
    console.error("customerLogin failed", error);
    return { error: "Could not sign in just now. Try again." };
  }
  redirect(safeNext(formData.get("next")));
}

export async function customerRegister(_prev: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) return { error: "Passwords do not match." };
  try {
    const meta = await requestMeta();
    const result = await registerCustomer({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    if (!result.ok) return { error: result.error };
    await setCustomerCookie(result.token);
  } catch (error) {
    console.error("customerRegister failed", error);
    return { error: "Could not create the account just now. Try again." };
  }
  redirect("/account");
}

export async function customerLogout() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await destroyCustomerSession(token);
  await clearCustomerCookie();
}
