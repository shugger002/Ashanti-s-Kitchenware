import { cookies } from "next/headers";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { getSessionTtlDays, isProduction } from "@/server/env";
import { generateOpaqueToken, hashToken } from "@/server/auth/tokens";

export const CUSTOMER_COOKIE = process.env.CUSTOMER_SESSION_COOKIE_NAME ?? "ak_customer_session";

export type StoreCustomer = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
};

export async function createCustomerSession(input: {
  customerId: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<string> {
  const token = generateOpaqueToken();
  const days = getSessionTtlDays();
  await query(sql`
    INSERT INTO customer_sessions (customer_id, token_hash, expires_at, ip, user_agent)
     VALUES (${input.customerId}, ${hashToken(token)}, now() + (${String(days)} || ' days')::interval, ${input.ip}, ${input.userAgent})
  `);
  return token;
}

export async function destroyCustomerSession(token: string): Promise<void> {
  await query(sql`DELETE FROM customer_sessions WHERE token_hash = ${hashToken(token)}`);
}

export async function getCustomerFromToken(token: string): Promise<StoreCustomer | null> {
  const result = await query<{
    id: string;
    email: string | null;
    full_name: string;
    phone: string;
  }>(sql`
    SELECT c.id, c.email, c.full_name, c.phone
     FROM customer_sessions s
     JOIN customers c ON c.id = s.customer_id
     WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now() AND c.password_hash IS NOT NULL
  `);
  const row = result.rows[0];
  if (!row?.email) return null;
  return { id: row.id, email: row.email, fullName: row.full_name, phone: row.phone };
}

export async function readStoreCustomer(): Promise<StoreCustomer | null> {
  try {
    const jar = await cookies();
    const token = jar.get(CUSTOMER_COOKIE)?.value;
    if (!token) return null;
    return getCustomerFromToken(token);
  } catch {
    return null;
  }
}

export async function setCustomerCookie(token: string): Promise<void> {
  const jar = await cookies();
  const days = getSessionTtlDays();
  jar.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

export async function clearCustomerCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
