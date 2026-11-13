import { cache } from "react";
import { cookies } from "next/headers";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import {
  getSessionCookieName,
  getSessionTtlDays,
  isProduction,
} from "@/server/env";
import { generateOpaqueToken, hashToken } from "@/server/auth/tokens";
import { normalizeAdminRoles, type AdminUser } from "@/server/auth/types";

type SessionRow = {
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string | string[] | null;
};

export async function createSession(input: {
  userId: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<string> {
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const days = getSessionTtlDays();
  await query(sql`
    INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent)
     VALUES (${input.userId}, ${tokenHash}, now() + make_interval(days => ${days}), ${input.ip}, ${input.userAgent})
  `);
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await query(sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`);
}

export async function getUserFromToken(token: string): Promise<AdminUser | null> {
  const result = await query<SessionRow>(sql`
    SELECT u.id AS user_id, u.email, u.full_name, u.is_active,
            COALESCE((
              SELECT string_agg(ur.role_slug, ',')
               FROM user_roles ur
              WHERE ur.user_id = u.id
            ), '') AS roles
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
  `);
  const row = result.rows[0];
  if (!row || !row.is_active) return null;
  return {
    id: row.user_id,
    email: row.email,
    fullName: row.full_name,
    roles: normalizeAdminRoles(row.roles),
  };
}

export const readSessionUser = cache(async (): Promise<AdminUser | null> => {
  const jar = await cookies();
  const token = jar.get(getSessionCookieName())?.value;
  if (!token) return null;
  return getUserFromToken(token);
});

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  const days = getSessionTtlDays();
  jar.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
