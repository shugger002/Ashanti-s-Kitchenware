import { handlePaymentWebhook } from "@/server/payments/handle-webhook";
import { HubtelProvider } from "@/server/payments/hubtel";

export async function POST(request: Request) {
  return handlePaymentWebhook(new HubtelProvider(), request);
}
