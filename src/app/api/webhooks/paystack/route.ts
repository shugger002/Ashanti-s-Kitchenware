import { handlePaymentWebhook } from "@/server/payments/handle-webhook";
import { PaystackProvider } from "@/server/payments/paystack";

export async function POST(request: Request) {
  return handlePaymentWebhook(new PaystackProvider(), request);
}
