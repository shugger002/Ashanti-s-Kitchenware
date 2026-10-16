import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { isLoginBlocked, recordAuthFailure, recordLoginAttempt } from "@/server/auth/rate-limit";
import { createSession } from "@/server/auth/session";
import { writeAuditLog } from "@/server/auth/audit";
import type { RoleSlug } from "@/server/auth/types";

export async function authenticateAdmin(input: {
  email: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  try {
    if (await isLoginBlocked(email, input.ip)) {
      return { ok: false, error: "Too many failed attempts. Try again in 15 minutes." };
    }
  } catch (error) {
    console.error("admin login rate limit skipped", error);
  }

  const result = await query<{
    id: string;
    password_hash: string;
    is_active: boolean;
  }>(sql`
    SELECT u.id, u.password_hash, u.is_active
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     WHERE lower(u.email) = ${email}
     GROUP BY u.id
     HAVING count(ur.role_slug) > 0
  `);
  const user = result.rows[0];
  if (!user || !user.is_active) {
    await recordAuthFailure(email, input.ip);
    return { ok: false, error: "Invalid email or password." };
  }

  const valid = await verifyPassword(user.password_hash, input.password);
  if (!valid) {
    await recordAuthFailure(email, input.ip);
    return { ok: false, error: "Invalid email or password." };
  }

  await recordLoginAttempt({ identifier: email, success: true, ip: input.ip });
  const token = await createSession({
    userId: user.id,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
  });
  return { ok: true, token };
}

export async function createAdminUser(input: {
  email: string;
  password: string;
  fullName: string;
  roles: RoleSlug[];
}): Promise<string> {
  if (input.password.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }
  const passwordHash = await hashPassword(input.password);
  const inserted = await query<{ id: string }>(sql`
    INSERT INTO users (email, password_hash, full_name)
     VALUES (${input.email.trim().toLowerCase()}, ${passwordHash}, ${input.fullName.trim()})
     RETURNING id
  `);
  const id = inserted.rows[0].id;
  for (const role of input.roles) {
    await query(sql`INSERT INTO user_roles (user_id, role_slug) VALUES (${id}, ${role})`);
  }
  return id;
}
