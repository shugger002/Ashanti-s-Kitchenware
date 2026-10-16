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
  const photosOk = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) || !isProduction();
  const objectStorage = photosOk
    ? "Ready"
    : "Not set up yet";

  const rows = [
    { label: "Database", value: databaseOk ? "Working" : "Down", ok: databaseOk },
    { label: "Staff email", value: smtpReady ? "Ready" : "Not set up yet", ok: smtpReady },
    { label: "Product photos", value: objectStorage, ok: photosOk },
    { label: "Hubtel", value: isHubtelConfigured() ? "Ready" : "Not set up yet", ok: isHubtelConfigured() },
    { label: "Moolre", value: isMoolreConfigured() ? "Ready" : "Not set up yet", ok: isMoolreConfigured() },
    { label: "Paystack", value: process.env.PAYSTACK_SECRET_KEY ? "Ready" : "Not set up yet", ok: Boolean(process.env.PAYSTACK_SECRET_KEY) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Connections"
        description="Can this shop talk to the database, send mail, store photos, and take payment. Keys are not shown here."
      />
      <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
        {rows.map((row) => (
          <li key={row.label} className="flex min-h-14 items-center justify-between gap-4 px-5 py-4 text-sm">
            <span>{row.label}</span>
            <span className={row.ok ? "text-foreground" : "text-accent"}>{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
