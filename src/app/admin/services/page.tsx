import { requirePermission } from "@/server/auth/authorize";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { isProduction } from "@/server/env";
import { isHubtelConfigured } from "@/server/payments/hubtel";
import { isMoolreConfigured } from "@/server/payments/moolre";
import { AdminPageHeader } from "@/components/admin/ui";

async function pingDatabase() {
  try {
    await query(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

export default async function ServiceHealthPage() {
  const [, databaseOk] = await Promise.all([requirePermission("settings.write"), pingDatabase()]);
  const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
  const objectStorage =
    process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID
      ? process.env.S3_ENDPOINT?.includes("supabase")
        ? "Supabase Storage"
        : "S3"
      : isProduction()
        ? "Missing (required in production)"
        : "Local uploads (development)";

  const rows = [
    { label: "Database", value: databaseOk ? "Reachable" : "Unreachable", ok: databaseOk },
    { label: "Staff email (SMTP)", value: smtpReady ? "Configured" : "Not configured", ok: smtpReady },
    { label: "Product images", value: objectStorage, ok: Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) || !isProduction() },
    { label: "Hubtel keys", value: isHubtelConfigured() ? "Present" : "Not set", ok: isHubtelConfigured() },
    { label: "Moolre keys", value: isMoolreConfigured() ? "Present" : "Not set", ok: isMoolreConfigured() },
    { label: "Paystack key", value: process.env.PAYSTACK_SECRET_KEY ? "Present" : "Not set", ok: Boolean(process.env.PAYSTACK_SECRET_KEY) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Service health"
        description="Whether this host can talk to the database, send mail, store photos, and see payment keys. Keys are not shown. Payment APIs are not called from here."
      />
      <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
            <span>{row.label}</span>
            <span className={row.ok ? "text-foreground" : "text-accent"}>{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
