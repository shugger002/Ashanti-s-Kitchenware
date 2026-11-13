import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { writeAuditLog } from "@/server/auth/audit";
import { hashToken } from "@/server/auth/tokens";

export async function changeOwnPassword(input: {
  userId: string;
  currentPassword: string;
  nextPassword: string;
  sessionToken: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.nextPassword.length < 12) {
    return { ok: false, error: "New password must be at least 12 characters." };
  }
  const row = await query<{ password_hash: string }>(
    sql`SELECT password_hash FROM users WHERE id = ${input.userId} AND is_active = TRUE`,
  );
  const hash = row.rows[0]?.password_hash;
  if (!hash || !(await verifyPassword(hash, input.currentPassword))) {
    return { ok: false, error: "Current password is not correct." };
  }
  const passwordHash = await hashPassword(input.nextPassword);
  await query(sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${input.userId}`);
  if (input.sessionToken) {
    const keep = hashToken(input.sessionToken);
    await query(sql`DELETE FROM sessions WHERE user_id = ${input.userId} AND token_hash <> ${keep}`);
  } else {
    await query(sql`DELETE FROM sessions WHERE user_id = ${input.userId}`);
  }
  await writeAuditLog({
    actorUserId: input.userId,
    action: "auth.password.change",
    entityType: "user",
    entityId: input.userId,
  });
  return { ok: true };
}
