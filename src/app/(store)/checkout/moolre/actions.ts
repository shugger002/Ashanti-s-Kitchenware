"use server";

import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { getAppUrl } from "@/server/env";
import { MoolreProvider } from "@/server/payments/moolre";

export async function submitMoolreOtp(formData: FormData) {
  const publicRef = String(formData.get("ref") ?? "");
  const otpCode = String(formData.get("otp") ?? "").trim();
  if (!publicRef || !otpCode) return { ok: false as const, error: "Enter the SMS code from Moolre." };
  const order = await query<{
    id: string;
    email: string | null;
    full_name: string;
    phone: string;
    total: string;
    payment_status: string;
  }>(sql`SELECT id, email, full_name, phone, total::text, payment_status FROM orders WHERE public_ref = ${publicRef}`);
  const row = order.rows[0];
  if (!row) return { ok: false as const, error: "Order not found." };
  if (row.payment_status === "paid") return { ok: true as const, redirectUrl: `/checkout/success?ref=${encodeURIComponent(publicRef)}` };
  try {
    const payment = await query<{ provider: string }>(
      sql`SELECT provider FROM payments WHERE order_id = ${row.id} ORDER BY created_at DESC LIMIT 1`,
    );
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
        sql`UPDATE payments SET provider_ref = ${intent.providerRef}, status = ${intent.status}, updated_at = now() WHERE order_id = ${row.id}`,
      );
    }
    return { ok: true as const, redirectUrl: intent.redirectUrl ?? `/checkout/success?ref=${encodeURIComponent(publicRef)}&await=momo` };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Moolre verification failed" };
  }
}
