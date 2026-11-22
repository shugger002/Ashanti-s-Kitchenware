"use server";

import { headers } from "next/headers";
import { markOrderPaid } from "@/server/checkout/service";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { hitRateLimit } from "@/server/auth/rate-limit";
import { clientIp } from "@/server/http/client-ip";
import { MoolreProvider, isMoolreConfigured, lookupMoolreCollection } from "@/server/payments/moolre";

const ORDER_REF = /^AK-\d{8}-[A-F0-9]{6,16}$/i;

export async function confirmMoolreDebit(publicRef: string) {
  const ref = publicRef.trim();
  if (!ORDER_REF.test(ref)) return { paid: false as const, failed: false as const };
  const order = await query<{ id: string; payment_status: string }>(
    sql`SELECT id, payment_status FROM orders WHERE public_ref = ${ref}`,
  );
  const row = order.rows[0];
  if (!row) return { paid: false as const, failed: false as const };
  if (row.payment_status === "paid") return { paid: true as const, failed: false as const };
  if (row.payment_status === "failed") return { paid: false as const, failed: true as const };
  const ip = clientIp(await headers());
  if (await hitRateLimit(`moolre-confirm:${ip ?? "unknown"}`, 20, ip)) {
    return { paid: false as const, failed: false as const };
  }
  if (!isMoolreConfigured()) return { paid: false as const, failed: false as const };
  try {
    const payment = await query<{ provider_ref: string | null }>(
      sql`SELECT provider_ref FROM payments WHERE order_id = ${row.id} ORDER BY created_at DESC LIMIT 1`,
    );
    const moolreRef = payment.rows[0]?.provider_ref?.trim() || ref;
    const event = await new MoolreProvider().verifyByExternalRef(moolreRef);
    if (event?.successful) {
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
      return { paid: again.rows[0]?.payment_status === "paid", failed: false as const };
    }
    const lookup = await lookupMoolreCollection(moolreRef);
    if (lookup.state === "failed") {
      await query(sql`
        UPDATE orders SET payment_status = 'failed', updated_at = now()
         WHERE id = ${row.id} AND payment_status IN ('pending', 'unpaid') AND status = 'pending_payment'
      `);
      await query(sql`
        UPDATE payments SET status = 'failed', updated_at = now()
         WHERE order_id = ${row.id} AND provider = 'moolre' AND status NOT IN ('successful', 'refunded')
      `);
      return { paid: false as const, failed: true as const };
    }
    return { paid: false as const, failed: false as const };
  } catch {
    return { paid: false as const, failed: false as const };
  }
}
