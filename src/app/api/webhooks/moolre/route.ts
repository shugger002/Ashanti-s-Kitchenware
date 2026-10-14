import { handlePaymentWebhook } from "@/server/payments/handle-webhook";
import { MoolreProvider } from "@/server/payments/moolre";

export async function POST(request: Request) {
  return handlePaymentWebhook(new MoolreProvider(), request);
}
