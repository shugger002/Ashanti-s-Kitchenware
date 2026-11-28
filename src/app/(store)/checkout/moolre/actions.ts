"use server";

import { headers } from "next/headers";
import { shopperError } from "@/lib/user-error";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { getAppUrl } from "@/server/env";
import { hitRateLimit } from "@/server/auth/rate-limit";
import { clientIp } from "@/server/http/client-ip";
import { MoolreProvider } from "@/server/payments/moolre";

const ORDER_REF = /^AK-\d{8}-[A-F0-9]{6,16}$/i;

export async function submitMoolreOtp(formData: FormData) {
  const publicRef = String(formData.get("ref") ?? "").trim();
  const otpCode = String(formData.get("otp") ?? "").trim();
  if (!ORDER_REF.test(publicRef) || otpCode.length !== 6 || /[\s\r\n\0]/.test(otpCode)) {
    return { ok: false as const, error: "Enter the SMS code from Moolre." };
  }
  const ip = clientIp(await headers());
  if (
    (await hitRateLimit(`moolre-otp:${ip ?? "unknown"}`, 8, ip)) ||
    (await hitRateLimit(`moolre-otp-ref:${publicRef.toUpperCase()}`, 5, ip))
  ) {
    return { ok: false as const, error: "Too many code attempts. Wait a few minutes and try again." };
  }
  const order = await query<{
    id: string;
    email: string | null;
    full_name: string;
    phone: string;
    total: string;
    payment_status: string;
    status: string;
  }>(sql`SELECT id, email, full_name, phone, total::text, payment_status, status FROM orders WHERE public_ref = ${publicRef}`);
  const row = order.rows[0];
  if (!row) return { ok: false as const, error: "Order not found." };
  if (row.payment_status === "paid") return { ok: true as const, redirectUrl: `/checkout/success?ref=${encodeURIComponent(publicRef)}` };
  if (row.status !== "pending_payment" || (row.payment_status !== "pending" && row.payment_status !== "unpaid")) {
    return { ok: false as const, error: "This order is not waiting for a Moolre code." };
  }
  try {
    const payment = await query<{ provider: string }>(
      sql`SELECT provider FROM payments WHERE order_id = ${row.id} ORDER BY created_at DESC LIMIT 1`,
    );
    if (payment.rows[0]?.provider !== "moolre") {
      return { ok: false as const, error: "This order is not waiting for a Moolre code." };
    }
    const channel = (["13", "6", "7"] as const).find((id) => id === formData.get("momoChannel")) ?? "13";
    const intent = await new MoolreProvider().createIntent({
      orderId: row.id,
      publicRef,
      email: row.email || "orders@ashantisakitchenware.com",
      fullName: row.full_name,
      phone: row.phone,
      amountGhs: Number(row.total),
      callbackUrl: `${getAppUrl()}/checkout/success?ref=${encodeURIComponent(publicRef)}`,
      momoChannel: channel,
      otpCode,
    });
    if (intent.otpRequired) {
      return { ok: false as const, error: "That code was not accepted. Request a new SMS from Moolre and try again." };
    }
    if (payment.rows[0]?.provider) {
      await query(
        sql`UPDATE payments SET provider_ref = ${intent.providerRef}, status = ${intent.status}, updated_at = now() WHERE order_id = ${row.id} AND provider = 'moolre'`,
      );
    }
    return { ok: true as const, redirectUrl: intent.redirectUrl ?? `/checkout/success?ref=${encodeURIComponent(publicRef)}&await=momo` };
  } catch (error) {
    console.error("submitMoolreOtp failed", error);
    return {
      ok: false as const,
      error: shopperError(
        error,
        "That code could not be checked. Try again, or WhatsApp the shop if the prompt did not arrive.",
      ),
    };
  }
}
