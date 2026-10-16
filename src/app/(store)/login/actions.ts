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

export type CustomerAuthState = {
  error?: string;
  fullName?: string;
  email?: string;
  phone?: string;
} | null;

async function requestMeta() {
  const h = await headers();
  return {
    ip: clientIp(h),
    userAgent: h.get("user-agent")?.slice(0, 400) ?? null,
  };
}

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) return next;
  return "/account";
}

function isNextRedirect(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT"),
  );
}

export async function customerLogin(_prev: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const email = String(formData.get("email") ?? "");
  try {
    const meta = await requestMeta();
    const result = await authenticateCustomer({
      email,
      password: String(formData.get("password") ?? ""),
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    if (!result.ok) return { error: result.error, email };
    await setCustomerCookie(result.token);
    redirect(safeNext(formData.get("next")));
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("customerLogin failed", error);
    return { error: "Could not sign in just now. Try again.", email };
  }
}

export async function customerRegister(_prev: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const fields = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) return { error: "Passwords do not match.", ...fields };
  try {
    const meta = await requestMeta();
    const result = await registerCustomer({
      ...fields,
      password,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    if (!result.ok) return { error: result.error, ...fields };
    await setCustomerCookie(result.token);
    redirect("/account");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("customerRegister failed", error);
    return { error: "Could not create the account just now. Try again.", ...fields };
  }
}

export async function customerLogout() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await destroyCustomerSession(token);
  await clearCustomerCookie();
}
