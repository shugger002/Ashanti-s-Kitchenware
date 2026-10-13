import { query, withTransaction } from "@/server/db/pool";
import { hashPassword } from "@/server/auth/password";
import { generateOpaqueToken, hashToken } from "@/server/auth/tokens";
import { sendEmail } from "@/server/notifications/email";
import { getAppUrl } from "@/server/env";
import { writeAuditLog } from "@/server/auth/audit";
import { hitRateLimit } from "@/server/auth/rate-limit";

export function isPasswordResetEnabled(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

export async function requestPasswordReset(email: string, ip: string | null): Promise<{ ok: true }> {
  const normalized = email.trim().toLowerCase();
  if (await hitRateLimit(`reset:${normalized || "empty"}`, 5, ip)) return { ok: true };
  if (ip && (await hitRateLimit(`reset-ip:${ip}`, 8, ip))) return { ok: true };

  const user = await query<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE lower(email) = $1 AND is_active = TRUE`,
    [normalized],
  );
  if (!user.rows[0] || !isPasswordResetEnabled()) {
    return { ok: true };
  }
  const token = generateOpaqueToken();
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '1 hour')`,
    [user.rows[0].id, hashToken(token)],
  );
  const link = `${getAppUrl()}/admin/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.rows[0].email,
    subject: "Reset your Ashanti's Kitchenware staff password",
    text: `Use this link within one hour to set a new password:\n${link}\n\nIf you did not request this, ignore the email.`,
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
  return withTransaction(async (client) => {
    const row = await client.query<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [hashToken(input.token)],
    );
    if (!row.rows[0]) {
      return { ok: false as const, error: "This reset link is invalid or has expired." };
    }
    const passwordHash = await hashPassword(input.password);
    await client.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [
      row.rows[0].user_id,
      passwordHash,
    ]);
    await client.query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`, [row.rows[0].id]);
    await client.query(`DELETE FROM sessions WHERE user_id = $1`, [row.rows[0].user_id]);
    await writeAuditLog(
      {
        actorUserId: row.rows[0].user_id,
        action: "auth.password_reset_completed",
        entityType: "user",
        entityId: row.rows[0].user_id,
      },
      client,
    );
    return { ok: true as const };
  });
}
