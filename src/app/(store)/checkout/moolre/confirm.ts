"use server";

import { markOrderPaid } from "@/server/checkout/service";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { MoolreProvider, isMoolreConfigured } from "@/server/payments/moolre";

export async function confirmMoolreDebit(publicRef: string) {
  const ref = publicRef.trim();
  if (!ref) return { paid: false as const };
  const order = await query<{ payment_status: string }>(
    sql`SELECT payment_status FROM orders WHERE public_ref = ${ref}`,
  );
  if (!order.rows[0]) return { paid: false as const };
  if (order.rows[0].payment_status === "paid") return { paid: true as const };
  if (!isMoolreConfigured()) return { paid: false as const };
  try {
    const event = await new MoolreProvider().verifyByExternalRef(ref);
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
