"use server";

import { headers } from "next/headers";
import { markOrderPaid } from "@/server/checkout/service";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { hitRateLimit } from "@/server/auth/rate-limit";
import { clientIp } from "@/server/http/client-ip";
import { MoolreProvider, isMoolreConfigured } from "@/server/payments/moolre";

const ORDER_REF = /^AK-\d{8}-[A-F0-9]{6,16}$/i;

export async function confirmMoolreDebit(publicRef: string) {
  const ref = publicRef.trim();
  if (!ORDER_REF.test(ref)) return { paid: false as const };
  const ip = clientIp(await headers());
  if (await hitRateLimit(`moolre-confirm:${ip ?? "unknown"}`, 20, ip)) {
    return { paid: false as const };
  }
  const order = await query<{ payment_status: string }>(
    sql`SELECT payment_status FROM orders WHERE public_ref = ${ref}`,
  );
  if (!order.rows[0]) return { paid: false as const };
  if (order.rows[0].payment_status === "paid") return { paid: true as const };
  if (!isMoolreConfigured()) return { paid: false as const };
  try {
    const payment = await query<{ provider_ref: string | null }>(
      sql`SELECT provider_ref FROM payments WHERE order_id = (SELECT id FROM orders WHERE public_ref = ${ref}) ORDER BY created_at DESC LIMIT 1`,
    );
    const moolreRef = payment.rows[0]?.provider_ref?.trim() || ref;
    const event = await new MoolreProvider().verifyByExternalRef(moolreRef);
    if (!event?.successful) return { paid: false as const };
    await markOrderPaid({
      publicRef: ref,
      providerRef: event.providerRef,
      providerEventId: event.providerEventId,
      provider: event.provider,
      amountGhs: event.amountGhs,
      payload: event.payload,
    });
    const again = await query<{ payment_status: string }>(
      sql`SELECT payment_status FROM orders WHERE public_ref = ${ref}`,
    );
    return { paid: again.rows[0]?.payment_status === "paid" };
  } catch {
    return { paid: false as const };
  }
}
