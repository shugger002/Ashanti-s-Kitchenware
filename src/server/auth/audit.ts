import type { Db } from "@/server/db/pool";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

export async function writeAuditLog(
  input: {
    actorUserId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
  db?: Db,
): Promise<void> {
  const q = sql`
    INSERT INTO admin_audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (${input.actorUserId}, ${input.action}, ${input.entityType}, ${input.entityId ?? null}, ${JSON.stringify(input.metadata ?? {})}::jsonb)
  `;
  if (db) {
    await db.query(q);
    return;
  }
  await query(q);
}
