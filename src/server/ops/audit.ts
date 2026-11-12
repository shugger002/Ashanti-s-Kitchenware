import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

const SENSITIVE = /(secret|password|token|authorization|cookie|api[_-]?key|pubkey|webhook)/i;

export type AuditRow = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  ok: boolean;
};

export function redactMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof entry === "string" && SENSITIVE.test(entry)) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" || entry == null) {
      out[key] = entry;
    } else {
      out[key] = "[omitted]";
    }
  }
  return out;
}

export async function listAdminActivity(limit = 40): Promise<AuditRow[]> {
  const result = await query<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    actor: string | null;
  }>(sql`
    SELECT a.id::text, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
           COALESCE(u.full_name, u.email, 'System') AS actor
     FROM admin_audit_logs a
     LEFT JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC
     LIMIT ${limit}
  `);
  return result.rows.map((row) => {
    const metadata = redactMetadata(row.metadata);
    const failed = /fail|error|denied/i.test(row.action) || metadata.ok === false;
    return {
      id: row.id,
      actor: row.actor ?? "System",
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata,
      createdAt: row.created_at,
      ok: !failed,
    };
  });
}
