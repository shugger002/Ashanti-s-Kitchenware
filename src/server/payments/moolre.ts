import { timingSafeEqual } from "node:crypto";
import { ghanaLocalMsisdn } from "@/lib/phone-gh";
import { parseMoney } from "@/lib/money";
import { getAppUrl } from "@/server/env";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifiedPaymentEvent,
} from "@/server/payments/types";

export function isMoolreConfigured(): boolean {
  return Boolean(
    process.env.MOOLRE_API_USER && process.env.MOOLRE_API_PUBKEY && process.env.MOOLRE_ACCOUNT_NUMBER,
  );
}

export class MoolreProvider implements PaymentProvider {
  readonly id = "moolre" as const;

  async createIntent(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const user = process.env.MOOLRE_API_USER;
    const key = process.env.MOOLRE_API_PUBKEY;
    const account = process.env.MOOLRE_ACCOUNT_NUMBER;
    if (!user || !key || !account) throw new Error("Moolre credentials are not set");
    const response = await fetch("https://api.moolre.com/open/transact/payment", {
      method: "POST",
      headers: {
        "X-API-USER": user,
        "X-API-PUBKEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: 1,
        channel: input.momoChannel ?? "13",
        currency: "GHS",
        payer: ghanaLocalMsisdn(input.phone),
        amount: parseMoney(input.amountGhs).toFixed(2),
        externalref: input.publicRef,
        accountnumber: account,
        reference: `Ashantis ${input.publicRef}`,
        ...(input.otpCode ? { otpcode: input.otpCode } : {}),
      }),
    });
    const json = (await response.json()) as {
      status?: number | string;
      code?: string;
      message?: string | null;
      data?: string;
    };
    if (json.code === "TP14") {
      return {
        provider: this.id,
        providerRef: input.publicRef,
        redirectUrl: `${getAppUrl()}/checkout/moolre?ref=${encodeURIComponent(input.publicRef)}`,
        status: "pending",
        otpRequired: true,
      };
    }
    if (!response.ok || json.code === "TP13" || String(json.status) === "0") {
      throw new Error(json.message || "Moolre could not start the mobile-money prompt");
    }
    return {
      provider: this.id,
      providerRef: json.data ? String(json.data) : input.publicRef,
      redirectUrl: `${getAppUrl()}/checkout/success?ref=${encodeURIComponent(input.publicRef)}&await=momo`,
      status: "pending",
    };
  }

  async parseWebhook(rawBody: Buffer, _headers: Headers): Promise<VerifiedPaymentEvent> {
    const payload = JSON.parse(rawBody.toString("utf8")) as {
      status?: number;
      code?: string;
      message?: string;
      data?: {
        txstatus?: number;
        amount?: string;
        transactionid?: string | null;
        externalref?: string;
        secret?: string;
      };
    };
    const secret = process.env.MOOLRE_WEBHOOK_SECRET;
    if (!secret) throw new Error("MOOLRE_WEBHOOK_SECRET is not set");
    const given = payload.data?.secret ?? "";
    const a = Buffer.from(secret);
    const b = Buffer.from(given);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Invalid Moolre callback secret");
    }
    const ref = payload.data?.externalref;
    if (!ref) throw new Error("Moolre callback missing externalref");
    const successful = payload.status === 1 && payload.code === "P01" && payload.data?.txstatus === 1;
    return {
      provider: this.id,
      providerEventId: String(payload.data?.transactionid ?? `${ref}:${payload.code ?? "event"}`),
      providerRef: ref,
      eventType: payload.code ?? "callback",
      successful,
      amountGhs: Number(payload.data?.amount ?? 0),
      payload: payload as unknown as Record<string, unknown>,
    };
  }
}
