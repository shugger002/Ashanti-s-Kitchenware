import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { writeAuditLog } from "@/server/auth/audit";

export type OpsJobRun = {
  id: string;
  job: string;
  status: "ok" | "failed" | "skipped";
  summary: string;
  entityId: string | null;
  retryable: boolean;
  createdAt: string;
};

function sanitise(detail: string) {
  return detail
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|secret|token|password)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .slice(0, 240);
}

export async function recordJobRun(input: {
  job: string;
  status: OpsJobRun["status"];
  summary: string;
  entityId?: string | null;
  retryable?: boolean;
}): Promise<void> {
  try {
    await query(sql`
      INSERT INTO ops_job_runs (job, status, summary, entity_id, retryable)
       VALUES (
         ${input.job},
         ${input.status},
         ${sanitise(input.summary)},
         ${input.entityId ?? null},
         ${Boolean(input.retryable)}
       )
    `);
  } catch (error) {
    console.error("recordJobRun skipped", error);
  }
}

export async function listFailedJobs(limit = 20): Promise<OpsJobRun[]> {
  try {
    const result = await query<{
      id: string;
      job: string;
      status: OpsJobRun["status"];
      summary: string;
      entity_id: string | null;
      retryable: boolean;
      created_at: string;
    }>(sql`
      SELECT id, job, status, summary, entity_id, retryable, created_at
       FROM ops_job_runs
       WHERE status = 'failed'
       ORDER BY created_at DESC
       LIMIT ${limit}
    `);
    return result.rows.map((row) => ({
      id: row.id,
      job: row.job,
      status: row.status,
      summary: row.summary,
      entityId: row.entity_id,
      retryable: row.retryable,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function retryJob(jobId: string, actorUserId: string): Promise<{ ok: boolean; message: string }> {
  const result = await query<{
    id: string;
    job: string;
    entity_id: string | null;
    retryable: boolean;
    status: string;
  }>(sql`SELECT id, job, entity_id, retryable, status FROM ops_job_runs WHERE id = ${jobId}`);
  const row = result.rows[0];
  if (!row) return { ok: false, message: "That task is no longer on the desk." };
  if (!row.retryable || row.status !== "failed") {
    return { ok: false, message: "This task cannot be retried from the desk." };
  }

  let outcome: { ok: boolean; message: string };
  if (row.job === "low-stock-digest") {
    const { sendLowStockDigest } = await import("@/server/notifications/low-stock");
    const sent = await sendLowStockDigest({ force: true });
    outcome = sent.sent
      ? { ok: true, message: `Low-stock mail sent for ${sent.count} piece${sent.count === 1 ? "" : "s"}.` }
      : { ok: false, message: sent.reason ?? "Low-stock mail did not send." };
  } else if (row.job === "order-paid-email" && row.entity_id) {
    const { sendPaidOrderEmails } = await import("@/server/notifications/order-mail");
    await query(sql`DELETE FROM notification_sends WHERE event = ${`order-paid:${row.entity_id}`}`);
    await sendPaidOrderEmails(row.entity_id);
    outcome = { ok: true, message: "Paid-order mail was queued again. Check the shop inbox." };
  } else {
    return { ok: false, message: "No safe retry exists for this task." };
  }

  await query(sql`
    UPDATE ops_job_runs
       SET retryable = FALSE
     WHERE id = ${row.id}
  `);
  await writeAuditLog({
    actorUserId,
    action: outcome.ok ? "ops.job.retry" : "ops.job.retry_failed",
    entityType: "ops_job",
    entityId: row.id,
    metadata: { job: row.job, ok: outcome.ok },
  });
  await recordJobRun({
    job: `${row.job}:retry`,
    status: outcome.ok ? "ok" : "failed",
    summary: outcome.message,
    entityId: row.entity_id,
    retryable: false,
  });
  return outcome;
}
