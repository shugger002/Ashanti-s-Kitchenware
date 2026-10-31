import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 8;
const MAX_IP_FAILURES = 40;

export async function recordLoginAttempt(input: {
  identifier: string;
  success: boolean;
  ip: string | null;
}): Promise<void> {
  await query(
    sql`INSERT INTO login_attempts (identifier, success, ip) VALUES (${input.identifier.toLowerCase()}, ${input.success}, ${input.ip})`,
  );
}

export async function tooManyAttempts(
  identifier: string,
  max: number,
  windowMinutes = WINDOW_MINUTES,
): Promise<boolean> {
  const result = await query<{ count: string }>(sql`
    SELECT count(*)::text AS count
     FROM login_attempts
     WHERE identifier = ${identifier.toLowerCase()}
       AND success = FALSE
       AND attempted_at > now() - make_interval(mins => ${windowMinutes})
  `);
  return Number(result.rows[0]?.count ?? 0) >= max;
}

export async function isIpRateLimited(ip?: string | null): Promise<boolean> {
  if (!ip) return false;
  return tooManyAttempts(`ip:${ip}`, MAX_IP_FAILURES);
}

export async function isIdentifierThrottled(identifier: string): Promise<boolean> {
  return tooManyAttempts(identifier, MAX_FAILURES);
}

/** Identifier window plus IP window. Account lockout is checked separately on the user row. */
export async function isLoginBlocked(identifier: string, ip?: string | null): Promise<boolean> {
  if (await isIdentifierThrottled(identifier)) return true;
  if (await isIpRateLimited(ip)) return true;
  return false;
}

export async function recordIpFailure(ip: string | null): Promise<void> {
  if (!ip) return;
  await recordLoginAttempt({ identifier: `ip:${ip}`, success: false, ip });
}

export async function recordAuthFailure(identifier: string, ip: string | null): Promise<void> {
  await recordLoginAttempt({ identifier, success: false, ip });
  await recordIpFailure(ip);
}

/** Count a public-form hit. Returns true when the caller should stop. */
export async function hitRateLimit(identifier: string, max: number, ip: string | null): Promise<boolean> {
  if (await tooManyAttempts(identifier, max)) return true;
  await recordLoginAttempt({ identifier, success: false, ip });
  return false;
}
