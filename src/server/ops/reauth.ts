import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { verifyPassword } from "@/server/auth/password";
import { hitRateLimit } from "@/server/auth/rate-limit";

export async function confirmAdminPassword(userId: string, password: string): Promise<boolean> {
  const trimmed = password.trim();
  if (!trimmed) return false;
  if (await hitRateLimit(`ops-reauth:${userId}`, 8, null)) return false;
  const result = await query<{ password_hash: string }>(
    sql`SELECT password_hash FROM users WHERE id = ${userId} AND is_active = TRUE`,
  );
  const hash = result.rows[0]?.password_hash;
  if (!hash) return false;
  return verifyPassword(hash, trimmed);
}
