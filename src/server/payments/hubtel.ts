import { getAppUrl } from "@/server/env";
import { ghanaInternationalMsisdn } from "@/lib/phone-gh";
import { parseMoney } from "@/lib/money";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifiedPaymentEvent,
} from "@/server/payments/types";

function basicAuth(): string {
  const id = process.env.HUBTEL_CLIENT_ID;
  const secret = process.env.HUBTEL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Hubtel client credentials are not set");
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

function checkoutUrl(): string {
  return (
    process.env.HUBTEL_CHECKOUT_URL ??
    "https://rmp.hubtel.com/merchantaccount/onlinecheckout/invoice/create"
  );
}

export function isHubtelConfigured(): boolean {
  return Boolean(
    process.env.HUBTEL_CLIENT_ID &&
      process.env.HUBTEL_CLIENT_SECRET &&
      process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER,
  );
}

export class HubtelProvider implements PaymentProvider {
  readonly id = "hubtel" as const;

  async createIntent(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const account = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;
    if (!account) throw new Error("HUBTEL_MERCHANT_ACCOUNT_NUMBER is not set");
    const response = await fetch(checkoutUrl(), {
      method: "POST",
      headers: {
        Authorization: basicAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        totalAmount: parseMoney(input.amountGhs),
        description: `Ashanti's Kitchenware ${input.publicRef}`,
        callbackUrl: `${getAppUrl()}/api/webhooks/hubtel`,
        returnUrl: input.callbackUrl,
        cancellationUrl: input.callbackUrl,
        merchantAccountNumber: account,
        clientReference: input.publicRef,
        payeeName: input.fullName,
        payeeEmail: input.email,
        payeeMobileNumber: ghanaInternationalMsisdn(input.phone),
      }),
    });
    const json = (await response.json()) as {
      responseCode?: string;
      ResponseCode?: string;
      message?: string;
      Message?: string;
      data?: Record<string, unknown>;
      Data?: Record<string, unknown>;
    };
    const code = json.responseCode ?? json.ResponseCode;
    const data = json.data ?? json.Data ?? {};
    const url = String(data.checkoutUrl ?? data.checkoutDirectUrl ?? data.CheckoutUrl ?? "");
    if (!response.ok || (code && code !== "0000" && code !== "00") || !url) {
      throw new Error(json.message ?? json.Message ?? "Hubtel checkout could not be started");
    }
    const checkoutId = String(data.checkoutId ?? data.CheckoutId ?? input.publicRef);
    return {
      provider: this.id,
      providerRef: String(checkoutId),
      redirectUrl: url,
      status: "initialized",
    };
  }

  async parseWebhook(rawBody: Buffer, headers: Headers): Promise<VerifiedPaymentEvent> {
    const expected = process.env.HUBTEL_WEBHOOK_SECRET;
    if (expected) {
      const header = headers.get("authorization") ?? headers.get("x-hubtel-auth") ?? "";
      const bearer = header.replace(/^Bearer\s+/i, "");
      if (bearer !== expected && header !== expected) {
        throw new Error("Invalid Hubtel webhook credential");
      }
    }
    const payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    const data =
      payload.Data && typeof payload.Data === "object"
        ? (payload.Data as Record<string, unknown>)
        : payload.data && typeof payload.data === "object"
          ? (payload.data as Record<string, unknown>)
          : payload;
    const clientRef = String(data.ClientReference ?? data.clientReference ?? payload.ClientReference ?? "");
    const amount = Number(data.Amount ?? data.amount ?? payload.Amount ?? 0);
    const status = String(data.Status ?? data.status ?? payload.Status ?? payload.status ?? "").toLowerCase();
    const responseCode = String(
      payload.ResponseCode ?? payload.responseCode ?? data.ResponseCode ?? "",
    );
    const checkoutId = String(data.CheckoutId ?? data.checkoutId ?? data.TransactionId ?? clientRef);
    const successful =
      (status === "success" || status === "paid" || status === "completed") &&
      (responseCode === "" || responseCode === "0000" || responseCode === "00");
    if (!clientRef) throw new Error("Hubtel callback missing client reference");
    return {
      provider: this.id,
      providerEventId: checkoutId,
      providerRef: clientRef,
      eventType: successful ? "charge.success" : "charge.failed",
      successful,
      amountGhs: amount,
      payload,
    };
  }
}
