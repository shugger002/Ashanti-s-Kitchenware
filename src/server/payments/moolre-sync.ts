import { parseMoney } from "@/lib/money";
import { markOrderPaid } from "@/server/checkout/service";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { isMoolreConfigured, lookupMoolreCollection, type MoolreLookup } from "@/server/payments/moolre";

export type MoolreDeskState = MoolreLookup["state"] | "unreachable" | "mismatch" | "skipped";

type OpenMoolreOrder = {
  id: string;
  public_ref: string;
  total: string;
  payment_status: string;
  provider_ref: string | null;
};

async function openMoolreOrders(orderId?: string): Promise<OpenMoolreOrder[]> {
  if (orderId) {
    return (
      await query<OpenMoolreOrder>(sql`
        SELECT o.id, o.public_ref, o.total::text, o.payment_status, p.provider_ref
         FROM orders o
         JOIN LATERAL (
           SELECT provider_ref
            FROM payments
           WHERE order_id = o.id AND provider = 'moolre'
           ORDER BY created_at DESC
           LIMIT 1
         ) p ON true
        WHERE o.id = ${orderId}::uuid
          AND o.payment_status IN ('pending', 'unpaid', 'failed')
          AND o.status = 'pending_payment'
      `)
    ).rows;
  }
  return (
    await query<OpenMoolreOrder>(sql`
      SELECT o.id, o.public_ref, o.total::text, o.payment_status, p.provider_ref
       FROM orders o
       JOIN LATERAL (
         SELECT provider_ref
          FROM payments
         WHERE order_id = o.id AND provider = 'moolre'
         ORDER BY created_at DESC
         LIMIT 1
       ) p ON true
      WHERE o.payment_status IN ('pending', 'unpaid', 'failed')
        AND o.status = 'pending_payment'
        AND o.created_at > now() - interval '3 days'
      ORDER BY o.created_at DESC
      LIMIT 6
    `)
  ).rows;
}

async function applyLookup(order: OpenMoolreOrder, lookup: MoolreLookup): Promise<MoolreDeskState> {
  if (lookup.state === "paid") {
    if (lookup.amountGhs == null || parseMoney(lookup.amountGhs) !== parseMoney(order.total)) return "mismatch";
    await markOrderPaid({
      publicRef: order.public_ref,
      providerRef: lookup.transactionId || lookup.externalRef || order.public_ref,
      providerEventId: lookup.transactionId || `moolre-status:${order.public_ref}`,
      provider: "moolre",
      amountGhs: lookup.amountGhs,
      payload: {
        code: lookup.code,
        message: lookup.message,
        data: { transactionid: lookup.transactionId, externalref: lookup.externalRef },
      },
    });
    return "paid";
  }
  if (lookup.state === "failed" && order.payment_status !== "failed") {
    await query(sql`
      UPDATE orders SET payment_status = 'failed', updated_at = now()
       WHERE id = ${order.id} AND payment_status IN ('pending', 'unpaid') AND status = 'pending_payment'
    `);
    await query(sql`
      UPDATE payments SET status = 'failed', updated_at = now()
       WHERE order_id = ${order.id} AND provider = 'moolre' AND status NOT IN ('successful', 'refunded')
    `);
  }
  if (lookup.state === "pending" && order.payment_status === "failed") {
    await query(sql`
      UPDATE orders SET payment_status = 'pending', updated_at = now()
       WHERE id = ${order.id} AND payment_status = 'failed' AND status = 'pending_payment'
    `);
    await query(sql`
      UPDATE payments SET status = 'pending', updated_at = now()
       WHERE order_id = ${order.id} AND provider = 'moolre' AND status = 'failed'
    `);
  }
  return lookup.state;
}

async function lookupOrder(order: OpenMoolreOrder): Promise<MoolreLookup> {
  const refs = [order.provider_ref?.trim(), order.public_ref].filter((ref): ref is string => Boolean(ref));
  const unique = [...new Set(refs)];
  let last: MoolreLookup = { state: "unknown", amountGhs: null, transactionId: null, externalRef: null, code: "", message: "" };
  for (const ref of unique) {
    last = await lookupMoolreCollection(ref);
    if (last.state !== "unknown") return last;
  }
  return last;
}

/** Ask Moolre about recent unpaid mobile-money orders and write the answer onto the desk. */
export async function syncOpenMoolreOrders(): Promise<void> {
  if (!isMoolreConfigured()) return;
  const orders = await openMoolreOrders();
  for (const order of orders) {
    try {
      await applyLookup(order, await lookupOrder(order));
    } catch (error) {
      console.error("moolre desk sync skipped", order.public_ref, error);
    }
  }
}

export async function syncMoolreOrder(orderId: string): Promise<MoolreDeskState> {
  if (!isMoolreConfigured()) return "skipped";
  const orders = await openMoolreOrders(orderId);
  const order = orders[0];
  if (!order) return "skipped";
  try {
    return await applyLookup(order, await lookupOrder(order));
  } catch (error) {
    console.error("moolre order sync skipped", order.public_ref, error);
    return "unreachable";
  }
}
