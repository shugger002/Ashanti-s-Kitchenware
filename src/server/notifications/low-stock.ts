import { ghanaInternationalMsisdn } from "@/lib/phone-gh";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { claimNotification } from "@/server/notifications/claim";
import { sendEmail } from "@/server/notifications/email";
import { getStorefrontConfig } from "@/server/store/settings";
import { recordJobRun } from "@/server/ops/jobs";

export type LowStockRow = {
  name: string;
  sku: string;
  available: number;
  threshold: number;
};

export async function listLowStockRows(): Promise<LowStockRow[]> {
  const result = await query<LowStockRow>(sql`
    SELECT p.name, COALESCE(v.sku, p.sku) AS sku,
           (i.on_hand - i.reserved) AS available,
           i.low_stock_threshold AS threshold
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      LEFT JOIN product_variants v ON v.id = i.variant_id
     WHERE p.archived_at IS NULL
       AND p.is_active = TRUE
       AND COALESCE(v.sku, p.sku) NOT ILIKE 'DEMO-%'
       AND p.slug NOT ILIKE 'demo-%'
       AND (i.on_hand - i.reserved) <= i.low_stock_threshold
     ORDER BY (i.on_hand - i.reserved) ASC, p.name
  `);
  return result.rows;
}

export function lowStockWhatsAppHref(phoneE164: string, rows: LowStockRow[]): string | null {
  const digits = ghanaInternationalMsisdn(phoneE164);
  if (digits.length < 11 || rows.length === 0) return null;
  const body = [
    "Low stock at Ashanti's Kitchenware:",
    ...rows.slice(0, 30).map((row) => `• ${row.name} (${row.sku}) — ${row.available} left, alert at ${row.threshold}`),
  ].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

export async function sendLowStockDigest(options?: { force?: boolean }): Promise<{ sent: boolean; count: number; reason?: string }> {
  const rows = await listLowStockRows();
  if (rows.length === 0) return { sent: false, count: 0, reason: "nothing low" };
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });
  if (!options?.force && !(await claimNotification(`low-stock:${day}`))) {
    return { sent: false, count: rows.length, reason: "already sent today" };
  }
  if (options?.force) {
    await claimNotification(`low-stock:${day}:manual:${Date.now()}`);
  }
  const { contact } = await getStorefrontConfig();
  const lines = rows.map((row) => `${row.name} (${row.sku}): ${row.available} left (alert at ${row.threshold})`).join("\n");
  const result = await sendEmail({
    to: contact.email,
    subject: `Low stock: ${rows.length} ${rows.length === 1 ? "piece" : "pieces"}`,
    text: ["Pieces at or below the stock alert on the Accra desk:", "", lines].join("\n"),
  });
  await recordJobRun({
    job: "low-stock-digest",
    status: result.sent ? "ok" : "failed",
    summary: result.sent ? `Low-stock mail for ${rows.length} pieces` : result.reason ?? "Low-stock mail did not send",
    retryable: !result.sent,
  });
  return { sent: result.sent, count: rows.length, reason: result.reason };
}
