import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { getAnalyticsMeasurementId, getAppUrl, isProduction } from "@/server/env";
import { isMailConfigured } from "@/server/notifications/email";
import { isHubtelConfigured, hubtelCallbackUrl } from "@/server/payments/hubtel";
import { isMoolreConfigured, isMoolreWebhookConfigured, moolreCallbackUrl } from "@/server/payments/moolre";
import { getOperationsConfig } from "@/server/ops/settings";
import { listFailedJobs } from "@/server/ops/jobs";
import { listActiveShippingRates } from "@/server/shipping/service";

export type HealthState = "healthy" | "degraded" | "unavailable" | "unknown";

export type HealthCheck = {
  id: string;
  label: string;
  state: HealthState;
  detail: string;
  setup?: string;
  dashboardUrl?: string;
  dashboardLabel?: string;
  external: boolean;
};

export type HostingShortcut = {
  label: string;
  href: string;
  note: string;
  external: boolean;
};

function stateFrom(ok: boolean, missing: boolean, degraded = false): HealthState {
  if (missing) return "unknown";
  if (degraded) return "degraded";
  return ok ? "healthy" : "unavailable";
}

export async function runHealthChecks(): Promise<{
  checkedAt: string;
  checks: HealthCheck[];
  shortcuts: HostingShortcut[];
  failedJobs: Awaited<ReturnType<typeof listFailedJobs>>;
  operations: Awaited<ReturnType<typeof getOperationsConfig>>;
}> {
  const checkedAt = new Date().toISOString();
  let databaseOk = false;
  try {
    await query(sql`SELECT 1`);
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const [operations, failedJobs, rates] = await Promise.all([
    getOperationsConfig(),
    listFailedJobs(12),
    listActiveShippingRates().catch(() => []),
  ]);

  const smtpReady = isMailConfigured();
  const s3Ready = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID);
  const photosOk = s3Ready || !isProduction();
  const hubtel = isHubtelConfigured();
  const moolre = isMoolreConfigured();
  const moolreHook = isMoolreWebhookConfigured();
  const paystack = Boolean(process.env.PAYSTACK_SECRET_KEY);
  const vercel = Boolean(process.env.VERCEL || process.env.VERCEL_URL);
  const analytics = Boolean(getAnalyticsMeasurementId());

  const checks: HealthCheck[] = [
    {
      id: "database",
      label: "Shop data",
      state: databaseOk ? "healthy" : "unavailable",
      detail: databaseOk ? "Postgres answered." : "The database did not answer.",
      external: false,
    },
    {
      id: "checkout",
      label: "Checkout",
      state: operations.checkoutPaused ? "degraded" : moolre || hubtel || paystack ? "healthy" : "degraded",
      detail: operations.checkoutPaused
        ? "Paused from the desk. Carts and orders are kept."
        : moolre || hubtel || paystack
          ? "Open. Payment goes through a configured provider."
          : "Open, but no payment provider is configured.",
      external: false,
    },
    {
      id: "moolre",
      label: "Moolre",
      state: !moolre ? "unknown" : moolreHook ? "healthy" : "degraded",
      detail: !moolre
        ? "Keys are not set in the host."
        : moolreHook
          ? "Keys and callback secret are present. No live charge was sent."
          : "Keys are set. Callback secret is missing.",
      setup: "Set MOOLRE_API_USER, MOOLRE_API_PUBKEY, MOOLRE_ACCOUNT_NUMBER, and MOOLRE_WEBHOOK_SECRET in Vercel.",
      dashboardUrl: "https://app.moolre.com",
      dashboardLabel: "Moolre dashboard",
      external: true,
    },
    {
      id: "hubtel",
      label: "Hubtel",
      state: hubtel ? "healthy" : "unknown",
      detail: hubtel ? "Merchant keys are present. No live charge was sent." : "Hubtel keys are empty. Checkout will not offer Hubtel.",
      setup: "Set HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET, HUBTEL_MERCHANT_ACCOUNT_NUMBER, and HUBTEL_WEBHOOK_SECRET in Vercel.",
      dashboardUrl: "https://hubtel.com",
      dashboardLabel: "Hubtel",
      external: true,
    },
    {
      id: "paystack",
      label: "Paystack",
      state: paystack ? "healthy" : "unknown",
      detail: paystack ? "Secret is present. Unused unless selected." : "Not configured. Leave empty unless you switch this shop to Paystack.",
      dashboardUrl: "https://dashboard.paystack.com",
      dashboardLabel: "Paystack dashboard",
      external: true,
    },
    {
      id: "email",
      label: "Shop email",
      state: smtpReady ? "healthy" : "unknown",
      detail: smtpReady ? "SMTP or Resend is configured. Keys are not shown." : "Mail is not switched on. Password resets and order mail will not send.",
      setup: "Set SMTP_HOST, SMTP_FROM, SMTP_USER, SMTP_PASSWORD, or RESEND_API_KEY in Vercel.",
      external: true,
    },
    {
      id: "storage",
      label: "Product photos",
      state: stateFrom(photosOk, !s3Ready && isProduction()),
      detail: s3Ready ? "Object storage keys are present." : isProduction() ? "S3 is not set. New phone uploads may fail." : "Local disk in development.",
      setup: "Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY in Vercel.",
      external: true,
    },
    {
      id: "delivery",
      label: "Delivery settings",
      state: "healthy",
      detail:
        rates.length > 0
          ? `${rates.length} published rate${rates.length === 1 ? "" : "s"} on the desk. Checkout still quotes delivery on WhatsApp.`
          : "No published Ghana Cedi delivery rates. Collection and WhatsApp quotes still work.",
      dashboardUrl: "/admin/delivery",
      dashboardLabel: "Delivery on this desk",
      external: false,
    },
    {
      id: "hosting",
      label: "Hosting",
      state: vercel ? "healthy" : "unknown",
      detail: vercel ? `This process is on Vercel (${process.env.VERCEL_ENV ?? "unknown env"}).` : "Not running on Vercel, or the host flag is missing.",
      dashboardUrl: "https://vercel.com/dashboard",
      dashboardLabel: "Vercel dashboard",
      external: true,
    },
    {
      id: "analytics",
      label: "Google Analytics",
      state: analytics ? "healthy" : "unknown",
      detail: analytics ? "Measurement ID is set. Page counts still need cookie accept." : "No GA4 measurement ID.",
      external: true,
    },
  ];

  const shortcuts: HostingShortcut[] = [
    {
      label: "Shop",
      href: getAppUrl(),
      note: "Customer site. Open to check the live homepage.",
      external: true,
    },
    {
      label: "Vercel",
      href: "https://vercel.com/dashboard",
      note: "Env vars, deploys, and rollbacks live here. This desk cannot restart the host.",
      external: true,
    },
    {
      label: "GitHub",
      href: "https://github.com/shugger002/Ashanti-s-Kitchenware",
      note: "Source. Do not paste secrets into issues.",
      external: true,
    },
    {
      label: "Moolre",
      href: "https://app.moolre.com",
      note: `Callback URL: ${moolreCallbackUrl()}`,
      external: true,
    },
    {
      label: "Hubtel",
      href: "https://hubtel.com",
      note: `Callback URL: ${hubtelCallbackUrl()}`,
      external: true,
    },
  ];

  return { checkedAt, checks, shortcuts, failedJobs, operations };
}
