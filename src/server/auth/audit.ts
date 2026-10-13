import type { PoolClient } from "pg";
import { query } from "@/server/db/pool";

export async function writeAuditLog(
  input: {
    actorUserId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
  client?: PoolClient,
): Promise<void> {
  const sql = `INSERT INTO admin_audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
               VALUES ($1, $2, $3, $4, $5::jsonb)`;
  const params = [
    input.actorUserId,
    input.action,
    input.entityType,
    input.entityId ?? null,
    JSON.stringify(input.metadata ?? {}),
  ];
  if (client) {
    await client.query(sql, params);
    return;
  }
  await query(sql, params);
}
