import { NextResponse } from "next/server";
import { secretsEqual } from "@/lib/secrets";

const CONFIRMED_ACCOUNT = "11074306077738";
const EXPECTED_CALLBACK = "https://ashantiskitchenware.com/api/webhooks/moolre";
const REFS = [
  "AK-20261122-05C65D30E995E4A1",
  "AK-20261122-3D3EE24074A6225E",
  "AK-20261122-12AF67FD95707C9E",
];

function last4(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-4);
}

async function moolre(path: string, body: Record<string, unknown>, keyHeader: "X-API-PUBKEY" | "X-API-KEY") {
  const user = process.env.MOOLRE_API_USER?.trim() ?? "";
  const key = process.env.MOOLRE_API_PUBKEY?.trim() ?? "";
  const response = await fetch(`https://api.moolre.com${path}`, {
    method: "POST",
    headers: {
      "X-API-USER": user,
      [keyHeader]: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as {
    status?: number | string;
    code?: string;
    message?: string | null;
    data?: unknown;
    meta?: { requestid?: string; notices?: { code?: string }[] };
  } | null;
  return { http: response.status, json };
}

export async function GET(request: Request) {
  const secret = process.env.MOOLRE_CHECK_TOKEN?.trim() ?? "";
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !secretsEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const account = process.env.MOOLRE_ACCOUNT_NUMBER?.trim() ?? "";
  const payments = [];
  for (const ref of REFS) {
    try {
      const result = await moolre(
        "/open/transact/status",
        { type: 1, idtype: 1, id: ref, accountnumber: account },
        "X-API-PUBKEY",
      );
      const data = result.json?.data && typeof result.json.data === "object" ? (result.json.data as Record<string, unknown>) : {};
      const seenAccount = typeof data.accountnumber === "string" ? data.accountnumber : "";
      payments.push({
        ref,
        http: result.http,
        code: String(result.json?.code ?? ""),
        message: String(result.json?.message ?? "").slice(0, 180),
        requestId: result.json?.meta?.requestid ?? "",
        txstatus: data.txstatus ?? null,
        amount: data.amount ?? data.value ?? null,
        externalRef: typeof data.externalref === "string" ? data.externalref : "",
        accountMatchesConfirmed: seenAccount ? seenAccount === CONFIRMED_ACCOUNT : null,
        accountLast4: seenAccount ? last4(seenAccount) : "",
      });
    } catch (error) {
      payments.push({ ref, error: error instanceof Error ? error.message.slice(0, 160) : "failed" });
    }
  }

  let wallet: Record<string, unknown> = { checked: false };
  try {
    const result = await moolre("/open/account/status", { type: 1, accountnumber: account }, "X-API-PUBKEY");
    const data = result.json?.data && typeof result.json.data === "object" ? (result.json.data as Record<string, unknown>) : {};
    const callback = typeof data.callback === "string" ? data.callback : "";
    wallet = {
      http: result.http,
      code: String(result.json?.code ?? ""),
      message: String(result.json?.message ?? "").slice(0, 180),
      requestId: result.json?.meta?.requestid ?? "",
      notices: (result.json?.meta?.notices ?? []).map((notice) => notice.code ?? "").filter(Boolean),
      activated: data.activated ?? null,
      accountName: typeof data.accountname === "string" ? data.accountname : "",
      callbackMatches: callback ? callback === EXPECTED_CALLBACK : null,
    };
  } catch (error) {
    wallet = { error: error instanceof Error ? error.message.slice(0, 160) : "failed" };
  }

  return NextResponse.json({
    ok: true,
    hasUser: Boolean(process.env.MOOLRE_API_USER?.trim()),
    hasPublicKey: Boolean(process.env.MOOLRE_API_PUBKEY?.trim()),
    hasPrivateKey: Boolean(process.env.MOOLRE_API_KEY?.trim()),
    hasWebhookSecret: Boolean(process.env.MOOLRE_WEBHOOK_SECRET?.trim()),
    accountMatchesConfirmed: account === CONFIRMED_ACCOUNT,
    accountLast4: last4(account),
    accountLength: account.length,
    payments,
    wallet,
  });
}
