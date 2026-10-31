import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  hitRateLimit,
  isIdentifierThrottled,
  isIpRateLimited,
  recordAuthFailure,
  recordIpFailure,
  recordLoginAttempt,
} from "@/server/auth/rate-limit";
import {
  LOGIN_LOCK_MESSAGE,
  clearCustomerLoginLockout,
  isAccountLocked,
  registerCustomerLoginFailure,
} from "@/server/auth/lockout";
import { createCustomerSession } from "@/server/customers/session";

const MIN_PASSWORD = 10;

export async function registerCustomer(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const fullName = input.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Enter your name." };
  const phoneDigits = phone.replace(/\D/g, "");
  if (phone.includes("@") || phoneDigits.length < 9) {
    return { ok: false, error: "Enter a Ghana phone number, not an email." };
  }
  if (input.password.length < MIN_PASSWORD) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
  }

  try {
    if (await hitRateLimit(`register:${email}`, 5, input.ip)) {
      return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
    }
    if (input.ip && (await hitRateLimit(`register-ip:${input.ip}`, 8, input.ip))) {
      return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
    }
  } catch (error) {
    console.error("register rate limit skipped", error);
  }

  const passwordHash = await hashPassword(input.password);
  let customerId: string;
  try {
    const existing = await query<{ id: string; password_hash: string | null }>(
      sql`SELECT id, password_hash FROM customers WHERE lower(email) = ${email} ORDER BY password_hash NULLS LAST LIMIT 1`,
    );
    const row = existing.rows[0];
    if (row?.password_hash) return { ok: false, error: "An account already exists for this email." };
    if (row) {
      await query(
        sql`UPDATE customers SET full_name = ${fullName}, phone = ${phone}, password_hash = ${passwordHash} WHERE id = ${row.id}`,
      );
      customerId = row.id;
    } else {
      const inserted = await query<{ id: string }>(
        sql`INSERT INTO customers (email, full_name, phone, password_hash) VALUES (${email}, ${fullName}, ${phone}, ${passwordHash}) RETURNING id`,
      );
      customerId = inserted.rows[0].id;
    }
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "23505") return { ok: false, error: "An account already exists for this email." };
    throw error;
  }

  const token = await createCustomerSession({
    customerId,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { ok: true, token };
}

export async function authenticateCustomer(input: {
  email: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const key = `customer:${email}`;
  try {
    if ((await isIpRateLimited(input.ip)) || (await isIdentifierThrottled(key))) {
      return { ok: false, error: LOGIN_LOCK_MESSAGE };
    }
  } catch (error) {
    console.error("login rate limit skipped", error);
  }
  const result = await query<{
    id: string;
    password_hash: string | null;
    locked_until: Date | string | null;
  }>(
    sql`SELECT id, password_hash, locked_until FROM customers WHERE lower(email) = ${email} AND password_hash IS NOT NULL`,
  );
  const row = result.rows[0];
  if (row && isAccountLocked(row.locked_until)) {
    await recordIpFailure(input.ip);
    return { ok: false, error: LOGIN_LOCK_MESSAGE };
  }
  if (!row?.password_hash) {
    await recordAuthFailure(key, input.ip);
    return { ok: false, error: "Invalid email or password." };
  }
  const valid = await verifyPassword(row.password_hash, input.password);
  if (!valid) {
    await recordAuthFailure(key, input.ip);
    await registerCustomerLoginFailure(row.id);
    return { ok: false, error: "Invalid email or password." };
  }
  await clearCustomerLoginLockout(row.id);
  await recordLoginAttempt({ identifier: key, success: true, ip: input.ip });
  const token = await createCustomerSession({
    customerId: row.id,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { ok: true, token };
}
