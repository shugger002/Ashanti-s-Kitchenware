import { NextResponse } from "next/server";
import { markOrderPaid } from "@/server/checkout/service";
import type { PaymentProvider } from "@/server/payments/types";

export async function handlePaymentWebhook(provider: PaymentProvider, request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  try {
    const event = await provider.parseWebhook(raw, request.headers);
    if (event.successful) {
      await markOrderPaid({
        publicRef: event.providerRef,
        providerRef: event.providerRef,
        providerEventId: event.providerEventId,
        provider: event.provider,
        amountGhs: event.amountGhs,
        payload: event.payload,
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook rejected" }, { status: 400 });
  }
}
