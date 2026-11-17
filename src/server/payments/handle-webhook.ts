import { NextResponse } from "next/server";
import { markOrderPaid } from "@/server/checkout/service";
import { sendFailedPaymentEmail } from "@/server/notifications/order-mail";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { confirmMoolreCallback } from "@/server/payments/moolre";
import type { PaymentProvider, VerifiedPaymentEvent } from "@/server/payments/types";

export async function handlePaymentWebhook(provider: PaymentProvider, request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  let event;
  try {
    event = await provider.parseWebhook(raw, request.headers);
  } catch {
    return NextResponse.json({ error: "Webhook rejected" }, { status: 400 });
  }
  try {
    const confirmed = event.successful ? await confirmedPayment(event) : { ok: false as const };
    if (confirmed.ok) {
      await markOrderPaid({
        publicRef: event.providerRef,
        providerRef: confirmed.providerRef,
        providerEventId: event.providerEventId,
        provider: event.provider,
        amountGhs: confirmed.amountGhs,
        payload: event.payload,
      });
    } else if ("retry" in confirmed && confirmed.retry) {
      return NextResponse.json({ error: "Payment is not confirmed yet" }, { status: 503 });
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

async function confirmedPayment(event: VerifiedPaymentEvent): Promise<
  { ok: true; amountGhs: number; providerRef: string } | { ok: false; retry: boolean }
> {
  if (event.provider !== "moolre") {
    return { ok: true, amountGhs: event.amountGhs, providerRef: event.providerRef };
  }
  const checked = await confirmMoolreCallback(event);
  if (!checked.paid) return { ok: false, retry: checked.retry };
  return {
    ok: true,
    amountGhs: checked.amountGhs,
    providerRef: checked.transactionId || event.providerRef,
  };
}
