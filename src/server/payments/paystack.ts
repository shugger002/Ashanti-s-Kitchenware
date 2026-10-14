import { createHmac, timingSafeEqual } from "node:crypto";
import { ghsToPesewas, pesewasToGhs } from "@/lib/money";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifiedPaymentEvent,
} from "@/server/payments/types";

export class PaystackProvider implements PaymentProvider {
  readonly id = "paystack" as const;

  async createIntent(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set");
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: ghsToPesewas(input.amountGhs),
        reference: input.publicRef,
        callback_url: input.callbackUrl,
        currency: "GHS",
        metadata: { orderId: input.orderId },
      }),
    });
    const json = (await response.json()) as {
      status: boolean;
      data?: { authorization_url: string; reference: string };
      message?: string;
    };
    if (!response.ok || !json.status || !json.data) {
      throw new Error(json.message ?? "Paystack initialize failed");
    }
    return {
      provider: this.id,
      providerRef: json.data.reference,
      redirectUrl: json.data.authorization_url,
      status: "initialized",
    };
  }

  async parseWebhook(rawBody: Buffer, headers: Headers): Promise<VerifiedPaymentEvent> {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack webhook secret is not set");
    const signature = headers.get("x-paystack-signature") ?? "";
    const digest = createHmac("sha512", secret).update(rawBody).digest("hex");
    const a = Buffer.from(digest);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Invalid Paystack signature");
    }
    const payload = JSON.parse(rawBody.toString("utf8")) as {
      event: string;
      data: {
        reference: string;
        id: number;
        amount: number;
        status: string;
      };
    };
    return {
      provider: this.id,
      providerEventId: String(payload.data.id),
      providerRef: payload.data.reference,
      eventType: payload.event,
      successful: payload.event === "charge.success" && payload.data.status === "success",
      amountGhs: pesewasToGhs(payload.data.amount),
      payload: payload as unknown as Record<string, unknown>,
    };
  }
}
