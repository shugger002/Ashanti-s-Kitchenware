import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { runHealthChecks } from "@/server/ops/health";
import { formatAccraWhen } from "@/lib/accra-time";
import { adminButton, AdminGlance, AdminPageHeader, AdminSection, EmptyState, StatusPill } from "@/components/admin/ui";
import { saveOperationsAction, retryJobAction } from "@/app/admin/ops/actions";
import { buttonClass } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function tone(state: string): "ok" | "attention" | "muted" | "danger" {
  if (state === "healthy") return "ok";
  if (state === "degraded") return "attention";
  if (state === "unavailable") return "danger";
  return "muted";
}

function label(state: string) {
  if (state === "healthy") return "Healthy";
  if (state === "degraded") return "Degraded";
  if (state === "unavailable") return "Unavailable";
  return "Unknown";
}

export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [{ error, notice }] = await Promise.all([searchParams, requirePermission("settings.write")]);
  let health: Awaited<ReturnType<typeof runHealthChecks>> | null = null;
  let loadError = "";
  try {
    health = await runHealthChecks();
  } catch {
    loadError = "Health checks did not finish. The shop data connection may be down.";
  }
  const operations = health?.operations;
  const counts = health
    ? {
        healthy: health.checks.filter((c) => c.state === "healthy").length,
        degraded: health.checks.filter((c) => c.state === "degraded").length,
        down: health.checks.filter((c) => c.state === "unavailable").length,
        unknown: health.checks.filter((c) => c.state === "unknown").length,
      }
    : null;

  return (
    <div>
      <AdminPageHeader
        title="Operations"
        description="Pause checkout, switch shop features, and see whether mail, payments, and hosting are talking to this desk. Secrets stay in Vercel."
      />
      {error ? (
        <p className="mt-4 border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-4 border border-border bg-white px-4 py-3 text-sm" role="status">
          {notice}
        </p>
      ) : null}

      {loadError ? (
        <p className="mt-6 text-sm text-accent">{loadError}</p>
      ) : health && counts ? (
        <AdminGlance
          className="mt-6"
          items={[
            { label: "Healthy", value: counts.healthy },
            { label: "Degraded", value: counts.degraded, warn: counts.degraded > 0 },
            { label: "Down", value: counts.down, warn: counts.down > 0 },
            { label: "Unknown", value: counts.unknown },
          ]}
        />
      ) : null}

      {health ? (
        <p className="mt-3 text-xs text-muted">Last checked {formatAccraWhen(health.checkedAt)} Accra time. Checks do not send a live payment.</p>
      ) : null}

      {operations ? (
        <form action={saveOperationsAction} className="mt-8 max-w-xl">
          <AdminSection
            title="Checkout and shop features"
            hint="Pausing checkout keeps carts and existing orders. The admin desk stays open. Type your password only when you change the pause switch."
          >
            <label className="flex min-h-12 items-start justify-between gap-3 py-2 text-sm">
              <span>
                Pause checkout
                <span className="mt-1 block text-xs text-muted">Shoppers can still browse. They cannot place a new order.</span>
              </span>
              <input
                type="checkbox"
                name="checkoutPaused"
                defaultChecked={operations.checkoutPaused}
                className="mt-1 size-5 accent-[#c8102e]"
              />
            </label>
            <label className="mt-4 block text-sm">
              Customer message
              <textarea
                name="maintenanceMessage"
                defaultValue={operations.maintenanceMessage}
                rows={3}
                className="input mt-1"
                maxLength={280}
              />
            </label>
            <label className="mt-4 flex min-h-12 items-center justify-between gap-3 text-sm">
              Reviews
              <input type="checkbox" name="reviewsEnabled" defaultChecked={operations.reviewsEnabled} className="size-5 accent-[#c8102e]" />
            </label>
            <label className="flex min-h-12 items-center justify-between gap-3 text-sm">
              Stock-update signups
              <input type="checkbox" name="newsletterEnabled" defaultChecked={operations.newsletterEnabled} className="size-5 accent-[#c8102e]" />
            </label>
            <label className="flex min-h-12 items-center justify-between gap-3 text-sm">
              Promo popup
              <input type="checkbox" name="promoPopupEnabled" defaultChecked={operations.promoPopupEnabled} className="size-5 accent-[#c8102e]" />
            </label>
            <label className="mt-4 block text-sm">
              Your admin password
              <span className="mt-0.5 block text-xs text-muted">Needed to pause or reopen checkout.</span>
              <input type="password" name="confirmPassword" autoComplete="current-password" className="input mt-1" />
            </label>
            <button className={`${adminButton()} mt-5`} type="submit">
              Save operations
            </button>
          </AdminSection>
        </form>
      ) : null}

      {health ? (
        <AdminSection className="mt-8" title="Site health">
          <ul className="divide-y divide-border">
            {health.checks.map((check) => (
              <li key={check.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{check.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{check.detail}</p>
                  {check.setup ? <p className="mt-1 text-xs text-muted">{check.setup}</p> : null}
                  {check.dashboardUrl ? (
                    <a
                      href={check.dashboardUrl}
                      className="mt-2 inline-flex min-h-11 items-center text-sm text-accent"
                      {...(check.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {check.dashboardLabel ?? "Open"} {check.external ? "(external)" : ""}
                    </a>
                  ) : null}
                </div>
                <StatusPill value={label(check.state)} tone={tone(check.state)} />
              </li>
            ))}
          </ul>
        </AdminSection>
      ) : null}

      {health ? (
        <AdminSection
          className="mt-8"
          title="Failed tasks"
          hint="Retries never create a new payment or order. Paid-order mail retry can send a second receipt if the first one actually arrived."
        >
          {health.failedJobs.length === 0 ? (
            <EmptyState title="No failed tasks" body="When mail or a background job fails, it shows here." />
          ) : (
            <ul className="divide-y divide-border">
              {health.failedJobs.map((job) => (
                <li key={job.id} className="space-y-3 py-4">
                  <p className="text-sm font-medium">{job.job}</p>
                  <p className="text-sm text-muted">{job.summary}</p>
                  <p className="text-xs text-muted">{formatAccraWhen(job.createdAt)}</p>
                  {job.retryable ? (
                    <form action={retryJobAction} className="space-y-2">
                      <input type="hidden" name="jobId" value={job.id} />
                      <label className="block text-sm">
                        Admin password
                        <input type="password" name="confirmPassword" required autoComplete="current-password" className="input mt-1" />
                      </label>
                      <button type="submit" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
                        Retry this task
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-muted">No safe retry from this desk.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
      ) : null}

      {health ? (
        <AdminSection
          className="mt-8"
          title="Hosting and dashboards"
          hint="Env vars and rollbacks are done in Vercel. This desk cannot restart the host or replace secrets."
        >
          <ul className="divide-y divide-border">
            {health.shortcuts.map((item) => (
              <li key={item.href} className="py-4">
                <a href={item.href} className="text-sm font-medium text-accent" target="_blank" rel="noreferrer">
                  {item.label} (external)
                </a>
                <p className="mt-1 break-all text-sm leading-relaxed text-muted">{item.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Restart, deploy, and rollback buttons are not on this desk. Use Vercel if you need those.
          </p>
          <Link href="/admin/activity" className="mt-3 inline-flex min-h-11 items-center text-sm text-accent">
            Staff activity log
          </Link>
        </AdminSection>
      ) : null}
    </div>
  );
}
