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

type MoolreEnvelope = {
  status?: number | string;
  code?: string;
  message?: string | null;
  data?: unknown;
};

type MoolreTxn = {
  txstatus?: number;
  amount?: string;
  value?: string;
  transactionid?: string | null;
  externalref?: string;
  secret?: string;
  reason?: string;
};

export function isMoolreConfigured(): boolean {
  return Boolean(
    process.env.MOOLRE_API_USER && process.env.MOOLRE_API_PUBKEY && process.env.MOOLRE_ACCOUNT_NUMBER,
  );
}

export function isMoolreWebhookConfigured(): boolean {
  return Boolean(process.env.MOOLRE_WEBHOOK_SECRET);
}

export function moolreCallbackUrl(): string {
  return `${getAppUrl()}/api/webhooks/moolre`;
}

function credentials() {
  const user = process.env.MOOLRE_API_USER;
  const key = process.env.MOOLRE_API_PUBKEY;
  const account = process.env.MOOLRE_ACCOUNT_NUMBER;
  if (!user || !key || !account) throw new Error("Moolre credentials are not set");
  return { user, key, account };
}

async function moolrePost(path: "/open/transact/payment" | "/open/transact/status", body: Record<string, unknown>) {
  const { user, key } = credentials();
  const response = await fetch(`https://api.moolre.com${path}`, {
    method: "POST",
    headers: {
      "X-API-USER": user,
      "X-API-PUBKEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let json: MoolreEnvelope;
  try {
    json = (await response.json()) as MoolreEnvelope;
  } catch {
    throw new Error("Moolre did not return a usable reply");
  }
  return { response, json, code: String(json.code ?? "") };
}

function collectionBody(input: CreatePaymentInput, otpCode?: string) {
  const { account } = credentials();
  return {
    type: 1,
    channel: input.momoChannel ?? "13",
    currency: "GHS",
    payer: ghanaLocalMsisdn(input.phone),
    amount: parseMoney(input.amountGhs).toFixed(2),
    externalref: input.publicRef,
    accountnumber: account,
    reference: `Ashantis ${input.publicRef}`,
    ...(otpCode ? { otpcode: otpCode } : {}),
  };
}

function otpPage(input: CreatePaymentInput): CreatePaymentResult {
  const channel = input.momoChannel ?? "13";
  const params = new URLSearchParams({ ref: input.publicRef, channel });
  return {
    provider: "moolre",
    providerRef: input.publicRef,
    redirectUrl: `${getAppUrl()}/checkout/moolre?${params.toString()}`,
    status: "pending",
    otpRequired: true,
  };
}

function promptSent(input: CreatePaymentInput, providerRef: string): CreatePaymentResult {
  return {
    provider: "moolre",
    providerRef,
    redirectUrl: `${getAppUrl()}/checkout/success?ref=${encodeURIComponent(input.publicRef)}&await=momo`,
    status: "pending",
  };
}

function asTxn(data: unknown): MoolreTxn | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as MoolreTxn;
}

export class MoolreProvider implements PaymentProvider {
  readonly id = "moolre" as const;

  async createIntent(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const first = await moolrePost("/open/transact/payment", collectionBody(input, input.otpCode));
    if (first.code === "TP14") {
      if (input.otpCode) {
        throw new Error("That SMS code was not accepted. Ask Moolre to send another and try again.");
      }
      return otpPage(input);
    }
    if (first.code === "TP17") {
      const prompt = await moolrePost("/open/transact/payment", collectionBody(input));
      return this.interpretPrompt(input, prompt);
    }
    return this.interpretPrompt(input, first);
  }

  private interpretPrompt(
    input: CreatePaymentInput,
    result: Awaited<ReturnType<typeof moolrePost>>,
  ): CreatePaymentResult {
    if (result.code === "TR099" || (String(result.json.status) === "1" && result.code !== "TP13" && result.code !== "TP14" && result.code !== "TP01")) {
      const data = result.json.data;
      const providerRef = typeof data === "string" && data && data !== "all" ? data : input.publicRef;
      return promptSent(input, providerRef);
    }
    if (result.code === "TP13") {
      throw new Error("This order already started a Moolre payment. Approve the prompt on the phone, or wait for confirmation.");
    }
    throw new Error(result.json.message || "Moolre could not start the mobile-money prompt");
  }

  async verifyByExternalRef(publicRef: string): Promise<VerifiedPaymentEvent | null> {
    const { account } = credentials();
    const result = await moolrePost("/open/transact/status", {
      type: 1,
      idtype: 1,
      id: publicRef,
      accountnumber: account,
    });
    const txn = asTxn(result.json.data);
    if (!txn) return null;
    const successful = result.code === "SS01" && txn.txstatus === 1;
    const amount = Number(txn.amount ?? txn.value ?? 0);
    if (!successful || !Number.isFinite(amount) || amount <= 0) return null;
    return {
      provider: this.id,
      providerEventId: String(txn.transactionid ?? `moolre-status:${publicRef}`),
      providerRef: String(txn.transactionid ?? publicRef),
      eventType: result.code,
      successful: true,
      amountGhs: amount,
      payload: result.json as unknown as Record<string, unknown>,
    };
  }

  async parseWebhook(rawBody: Buffer, _headers: Headers): Promise<VerifiedPaymentEvent> {
    const payload = JSON.parse(rawBody.toString("utf8")) as MoolreEnvelope & { data?: MoolreTxn };
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
      providerRef: successful ? String(payload.data?.transactionid ?? ref) : ref,
      eventType: payload.code ?? "callback",
      successful,
      amountGhs: Number(payload.data?.amount ?? 0),
      payload: payload as unknown as Record<string, unknown>,
    };
  }
}
