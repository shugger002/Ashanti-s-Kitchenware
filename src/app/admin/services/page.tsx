import { requirePermission } from "@/server/auth/authorize";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { isProduction } from "@/server/env";
import { isHubtelConfigured } from "@/server/payments/hubtel";
import { isMoolreConfigured } from "@/server/payments/moolre";
import { adminButton, AdminGlance, AdminPageHeader, AdminSection } from "@/components/admin/ui";
import { isMailConfigured, sendEmail } from "@/server/notifications/email";
import { getAnalyticsMeasurementId } from "@/server/env";
import { getStorefrontConfig } from "@/server/store/settings";
import { redirect } from "next/navigation";

async function pingDatabase() {
  try {
    await query(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

async function sendTestMail() {
  "use server";
  await requirePermission("settings.write");
  const { contact } = await getStorefrontConfig();
  const result = await sendEmail({
    to: contact.email,
    subject: "Ashanti's Kitchenware mail test",
    text: "If you can read this in the shop inbox, website email is working.",
  });
  redirect(result.sent ? "/admin/services?mail=sent" : "/admin/services?mail=fail");
}

export default async function ServiceHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ mail?: string }>;
}) {
  const [{ mail }, , databaseOk, config] = await Promise.all([
    searchParams,
    requirePermission("settings.write"),
    pingDatabase(),
    getStorefrontConfig(),
  ]);
  const smtpReady = isMailConfigured();
  const photosOk = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) || !isProduction();
  const objectStorage = photosOk ? "Ready" : "Not set up yet";

  const rows = [
    { label: "Shop data", value: databaseOk ? "Working" : "Down", ok: databaseOk },
    { label: "Shop email", value: smtpReady ? "Ready to send" : "Not set up yet", ok: smtpReady },
    { label: "Product photos", value: objectStorage, ok: photosOk },
    { label: "Hubtel", value: isHubtelConfigured() ? "Ready" : "Not set up yet", ok: isHubtelConfigured() },
    { label: "Moolre", value: isMoolreConfigured() ? "Ready" : "Not set up yet", ok: isMoolreConfigured() },
    { label: "Paystack", value: process.env.PAYSTACK_SECRET_KEY ? "Ready" : "Not set up yet", ok: Boolean(process.env.PAYSTACK_SECRET_KEY) },
    {
      label: "Shop visits",
      value: "Counted on this desk after cookie accept",
      ok: true,
    },
    {
      label: "Google Analytics",
      value: getAnalyticsMeasurementId() ? "Ready" : "Not set up yet",
      ok: Boolean(getAnalyticsMeasurementId()),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Connections"
        description="Can this shop talk to the database, send mail, store photos, and take payment. Keys are not shown here."
      />
      <AdminGlance
        items={[
          { label: "Working", value: rows.filter((row) => row.ok).length },
          { label: "Needs a key", value: rows.filter((row) => !row.ok).length, warn: rows.some((row) => !row.ok) },
        ]}
      />
      <ul className="admin-panel admin-panel-flush mt-8 divide-y divide-border overflow-hidden">
        {rows.map((row) => (
          <li key={row.label} className="flex min-h-14 items-center justify-between gap-4 px-5 py-4 text-sm">
            <span>{row.label}</span>
            <span className={row.ok ? "text-foreground" : "text-accent"}>{row.value}</span>
          </li>
        ))}
      </ul>
      <AdminSection className="mt-8 max-w-xl" title="Shop email">
        <p className="text-sm leading-relaxed text-muted">
          The shop inbox is {config.contact.email}. Contact messages, paid-order notices, and staff password
          resets send from that address when Gmail SMTP is switched on.
        </p>
        {smtpReady ? (
          <form action={sendTestMail} className="mt-4">
            <button className={adminButton()} type="submit">
              Send a test to {config.contact.email}
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-accent">Sending is not switched on yet.</p>
        )}
        {mail === "sent" ? <p className="mt-3 text-sm">Test sent. Check the shop inbox.</p> : null}
        {mail === "fail" ? (
          <p className="mt-3 text-sm text-accent">Test did not send. The mail key needs checking.</p>
        ) : null}
      </AdminSection>
    </div>
  );
}
