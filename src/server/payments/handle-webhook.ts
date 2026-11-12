import { NextResponse } from "next/server";
import { markOrderPaid } from "@/server/checkout/service";
import { sendFailedPaymentEmail } from "@/server/notifications/order-mail";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import type { PaymentProvider } from "@/server/payments/types";

export async function handlePaymentWebhook(provider: PaymentProvider, request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  let event;
  try {
    event = await provider.parseWebhook(raw, request.headers);
  } catch {
    return NextResponse.json({ error: "Webhook rejected" }, { status: 400 });
  }
  try {
    if (event.successful) {
      await markOrderPaid({
        publicRef: event.providerRef,
        providerRef: event.providerRef,
        providerEventId: event.providerEventId,
        provider: event.provider,
        amountGhs: event.amountGhs,
        payload: event.payload,
      });
    } else if (event.providerRef) {
      const order = await query<{ id: string }>(sql`
        SELECT id FROM orders
         WHERE public_ref = ${event.providerRef}
            OR public_ref = regexp_replace(${event.providerRef}, '\\.m[a-f0-9]{6}$', '', 'i')
            OR id IN (SELECT order_id FROM payments WHERE provider_ref = ${event.providerRef})
         LIMIT 1
      `);
      if (order.rows[0]) await sendFailedPaymentEmail(order.rows[0].id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("payment webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
