import { query, withTransaction } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { hashPassword } from "@/server/auth/password";
import { generateOpaqueToken, hashToken } from "@/server/auth/tokens";
import { isMailConfigured, sendEmail } from "@/server/notifications/email";
import { getAppUrl } from "@/server/env";
import { writeAuditLog } from "@/server/auth/audit";
import { hitRateLimit } from "@/server/auth/rate-limit";

export function isPasswordResetEnabled(): boolean {
  return isMailConfigured();
}

export async function requestPasswordReset(email: string, ip: string | null): Promise<{ ok: true }> {
  const normalized = email.trim().toLowerCase();
  if (await hitRateLimit(`reset:${normalized || "empty"}`, 5, ip)) return { ok: true };
  if (ip && (await hitRateLimit(`reset-ip:${ip}`, 8, ip))) return { ok: true };

  const user = await query<{ id: string; email: string }>(
    sql`SELECT id, email FROM users WHERE lower(email) = ${normalized} AND is_active = TRUE`,
  );
  if (!user.rows[0] || !isPasswordResetEnabled()) {
    return { ok: true };
  }
  const token = generateOpaqueToken();
  await query(sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (${user.rows[0].id}, ${hashToken(token)}, now() + interval '1 hour')
  `);
  const link = `${getAppUrl()}/admin/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.rows[0].email,
    subject: "Reset your Ashanti's Kitchenware staff password",
    text: `Use this link within one hour to set a new password:\n${link}\n\nIf you did not request this, ignore the email.`,
    html: `<p>Use this link within one hour to set a new password:</p><p><a href="${link}">Set a new password</a></p><p>If you did not request this, ignore the email.</p>`,
  });
  await writeAuditLog({
    actorUserId: user.rows[0].id,
    action: "auth.password_reset_requested",
    entityType: "user",
    entityId: user.rows[0].id,
  });
  return { ok: true };
}

export async function completePasswordReset(input: {
  token: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.password.length < 12) {
    return { ok: false, error: "Password must be at least 12 characters." };
  }
  return withTransaction(async (db) => {
    const row = await db.query<{ id: string; user_id: string }>(sql`
      SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = ${hashToken(input.token)} AND used_at IS NULL AND expires_at > now()
       FOR UPDATE
    `);
    if (!row.rows[0]) {
      return { ok: false as const, error: "This reset link is invalid or has expired." };
    }
    const passwordHash = await hashPassword(input.password);
    await db.query(
      sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${row.rows[0].user_id}`,
    );
    await db.query(sql`UPDATE password_reset_tokens SET used_at = now() WHERE id = ${row.rows[0].id}`);
    await db.query(sql`DELETE FROM sessions WHERE user_id = ${row.rows[0].user_id}`);
    await writeAuditLog(
      {
        actorUserId: row.rows[0].user_id,
        action: "auth.password_reset_completed",
        entityType: "user",
        entityId: row.rows[0].user_id,
      },
      db,
    );
    return { ok: true as const };
  });
}
