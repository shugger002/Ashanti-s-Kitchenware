import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

export const ACCOUNT_LOCK_AFTER = 5;
export const ACCOUNT_LOCK_MINUTES = 15;
export const LOGIN_LOCK_MESSAGE = "Too many failed attempts. Try again in 15 minutes.";

export function isAccountLocked(lockedUntil: Date | string | null | undefined): boolean {
  if (!lockedUntil) return false;
  const until = lockedUntil instanceof Date ? lockedUntil : new Date(lockedUntil);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() > Date.now();
}

export async function registerUserLoginFailure(userId: string): Promise<boolean> {
  const result = await query<{ locked_until: Date | string | null }>(sql`
    UPDATE users
       SET failed_login_count = CASE
             WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1
             ELSE failed_login_count + 1
           END,
           locked_until = CASE
             WHEN (
               CASE
                 WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1
                 ELSE failed_login_count + 1
               END
             ) >= ${ACCOUNT_LOCK_AFTER}
             THEN now() + make_interval(mins => ${ACCOUNT_LOCK_MINUTES})
             WHEN locked_until IS NOT NULL AND locked_until <= now() THEN NULL
             ELSE locked_until
           END,
           updated_at = now()
     WHERE id = ${userId}
     RETURNING locked_until
  `);
  return isAccountLocked(result.rows[0]?.locked_until);
}

export async function clearUserLoginLockout(userId: string): Promise<void> {
  await query(sql`
    UPDATE users
       SET failed_login_count = 0, locked_until = NULL, updated_at = now()
     WHERE id = ${userId} AND (failed_login_count <> 0 OR locked_until IS NOT NULL)
  `);
}

export async function registerCustomerLoginFailure(customerId: string): Promise<boolean> {
  const result = await query<{ locked_until: Date | string | null }>(sql`
    UPDATE customers
       SET failed_login_count = CASE
             WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1
             ELSE failed_login_count + 1
           END,
           locked_until = CASE
             WHEN (
               CASE
                 WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1
                 ELSE failed_login_count + 1
               END
             ) >= ${ACCOUNT_LOCK_AFTER}
             THEN now() + make_interval(mins => ${ACCOUNT_LOCK_MINUTES})
             WHEN locked_until IS NOT NULL AND locked_until <= now() THEN NULL
             ELSE locked_until
           END
     WHERE id = ${customerId}
     RETURNING locked_until
  `);
  return isAccountLocked(result.rows[0]?.locked_until);
}

export async function clearCustomerLoginLockout(customerId: string): Promise<void> {
  await query(sql`
    UPDATE customers
       SET failed_login_count = 0, locked_until = NULL
     WHERE id = ${customerId} AND (failed_login_count <> 0 OR locked_until IS NOT NULL)
  `);
}
