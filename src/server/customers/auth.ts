import { query } from "@/server/db/pool";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { hitRateLimit, isLoginBlocked, recordAuthFailure, recordLoginAttempt } from "@/server/auth/rate-limit";
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
  if (phone.length < 9) return { ok: false, error: "Enter a valid phone number." };
  if (input.password.length < MIN_PASSWORD) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
  }

  if (await hitRateLimit(`register:${email}`, 5, input.ip)) {
    return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  }
  if (input.ip && (await hitRateLimit(`register-ip:${input.ip}`, 8, input.ip))) {
    return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  }

  const taken = await query<{ id: string }>(
    `SELECT id FROM customers WHERE password_hash IS NOT NULL AND lower(email) = $1`,
    [email],
  );
  if ((taken.rowCount ?? 0) > 0) return { ok: false, error: "An account already exists for this email." };

  const passwordHash = await hashPassword(input.password);
  let customerId: string;
  try {
    const inserted = await query<{ id: string }>(
      `INSERT INTO customers (email, full_name, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`,
      [email, fullName, phone, passwordHash],
    );
    customerId = inserted.rows[0].id;
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
  if (await isLoginBlocked(key, input.ip)) {
    return { ok: false, error: "Too many failed attempts. Try again in 15 minutes." };
  }
  const result = await query<{ id: string; password_hash: string | null }>(
    `SELECT id, password_hash FROM customers WHERE lower(email) = $1 AND password_hash IS NOT NULL`,
    [email],
  );
  const row = result.rows[0];
  if (!row?.password_hash) {
    await recordAuthFailure(key, input.ip);
    return { ok: false, error: "Invalid email or password." };
  }
  const valid = await verifyPassword(row.password_hash, input.password);
  if (!valid) {
    await recordAuthFailure(key, input.ip);
    return { ok: false, error: "Invalid email or password." };
  }
  await recordLoginAttempt({ identifier: key, success: true, ip: input.ip });
  const token = await createCustomerSession({
    customerId: row.id,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { ok: true, token };
}
