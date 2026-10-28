import { query } from "@/server/db/pool";
import { likeContains, sql, sqlAnd } from "@/server/db/sql";
import { hashPassword } from "@/server/auth/password";
import { writeAuditLog } from "@/server/auth/audit";
import { PERMISSIONS, ROLE_SLUGS, type RoleSlug } from "@/server/auth/types";
import { isUuid } from "@/lib/utils";

export type StaffNeedFilter = "on" | "pack" | "paid" | "stock" | "blocked" | "all";

export type StaffListItem = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: RoleSlug[];
};

const PACK_ROLES = PERMISSIONS["orders.write"];
const PAID_ROLES = PERMISSIONS["payments.capture"];
const STOCK_ROLES = PERMISSIONS["inventory.write"];

function roleIn(roles: readonly RoleSlug[]) {
  const a = roles[0];
  const b = roles[1] ?? roles[0];
  const c = roles[2] ?? roles[0];
  return sql`EXISTS (
    SELECT 1 FROM user_roles ur
     WHERE ur.user_id = u.id AND ur.role_slug IN (${a}, ${b}, ${c})
  )`;
}

function hasRoleFilter(need: StaffNeedFilter | undefined) {
  if (need === "pack") return sql`u.is_active = TRUE AND ${roleIn(PACK_ROLES)}`;
  if (need === "paid") return sql`u.is_active = TRUE AND ${roleIn(PAID_ROLES)}`;
  if (need === "stock") return sql`u.is_active = TRUE AND ${roleIn(STOCK_ROLES)}`;
  if (need === "on") return sql`u.is_active = TRUE`;
  if (need === "blocked") return sql`u.is_active = FALSE`;
  return null;
}

function asRoles(value: string[] | null): RoleSlug[] {
  return (value ?? []).filter((role): role is RoleSlug => (ROLE_SLUGS as readonly string[]).includes(role));
}

export async function listStaff(filters: { q?: string; need?: StaffNeedFilter }): Promise<StaffListItem[]> {
  const where = [];
  if (filters.q?.trim()) {
    const pattern = likeContains(filters.q.trim());
    where.push(sql`(u.full_name ILIKE ${pattern} ESCAPE E'\\\\' OR u.email ILIKE ${pattern} ESCAPE E'\\\\')`);
  }
  const needFilter = hasRoleFilter(filters.need);
  if (needFilter) where.push(needFilter);
  const result = await query<{
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    roles: string[] | null;
  }>(sql`
    SELECT u.id, u.email, u.full_name, u.is_active,
            array_remove(array_agg(ur.role_slug), NULL) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     WHERE ${sqlAnd(where)}
     GROUP BY u.id
     ORDER BY u.full_name, u.email
  `);
  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    isActive: row.is_active,
    roles: asRoles(row.roles),
  }));
}

export async function countStaffGlance(): Promise<{
  people: number;
  onDesk: number;
  blocked: number;
  pack: number;
  paid: number;
}> {
  const result = await query<{
    people: string;
    on_desk: string;
    blocked: string;
    pack: string;
    paid: string;
  }>(sql`
    SELECT
      count(*)::text AS people,
      count(*) FILTER (WHERE u.is_active)::text AS on_desk,
      count(*) FILTER (WHERE NOT u.is_active)::text AS blocked,
      count(*) FILTER (WHERE u.is_active AND ${roleIn(PACK_ROLES)})::text AS pack,
      count(*) FILTER (WHERE u.is_active AND ${roleIn(PAID_ROLES)})::text AS paid
     FROM users u
  `);
  const row = result.rows[0];
  return {
    people: Number(row?.people ?? 0),
    onDesk: Number(row?.on_desk ?? 0),
    blocked: Number(row?.blocked ?? 0),
    pack: Number(row?.pack ?? 0),
    paid: Number(row?.paid ?? 0),
  };
}

export async function getStaffById(id: string): Promise<StaffListItem | null> {
  if (!isUuid(id)) return null;
  const result = await query<{
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    roles: string[] | null;
  }>(sql`
    SELECT u.id, u.email, u.full_name, u.is_active,
            array_remove(array_agg(ur.role_slug), NULL) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     WHERE u.id = ${id}
     GROUP BY u.id
  `);
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    isActive: row.is_active,
    roles: asRoles(row.roles),
  };
}

export async function countActiveOwners(exceptUserId?: string): Promise<number> {
  const result = await query<{ n: string }>(
    exceptUserId
      ? sql`
          SELECT count(*)::text AS n
           FROM users u
           JOIN user_roles ur ON ur.user_id = u.id AND ur.role_slug = 'super_admin'
           WHERE u.is_active = TRUE AND u.id <> ${exceptUserId}
        `
      : sql`
          SELECT count(*)::text AS n
           FROM users u
           JOIN user_roles ur ON ur.user_id = u.id AND ur.role_slug = 'super_admin'
           WHERE u.is_active = TRUE
        `,
  );
  return Number(result.rows[0]?.n ?? 0);
}

export function canChangeStaffLogin(input: {
  targetId: string;
  actorId: string;
  targetRoles: string[];
  nextActive: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (input.targetId === input.actorId && !input.nextActive) {
    return { ok: false, reason: "You cannot block your own login." };
  }
  return { ok: true };
}

export async function assertNotLastOwner(input: {
  userId: string;
  roles: string[];
  nextActive: boolean;
  nextRole?: RoleSlug;
}) {
  const willBeOwner = input.nextRole ? input.nextRole === "super_admin" : input.roles.includes("super_admin");
  if (input.nextActive && willBeOwner) return;
  if (!input.roles.includes("super_admin")) return;
  const others = await countActiveOwners(input.userId);
  if (others < 1) {
    throw new Error("Keep at least one store owner who can sign in.");
  }
}

export async function setStaffActive(input: { userId: string; actorUserId: string; isActive: boolean }) {
  const person = await getStaffById(input.userId);
  if (!person) throw new Error("Staff not found");
  const gate = canChangeStaffLogin({
    targetId: person.id,
    actorId: input.actorUserId,
    targetRoles: person.roles,
    nextActive: input.isActive,
  });
  if (!gate.ok) throw new Error(gate.reason);
  await assertNotLastOwner({ userId: person.id, roles: person.roles, nextActive: input.isActive });
  await query(sql`UPDATE users SET is_active = ${input.isActive}, updated_at = now() WHERE id = ${person.id}`);
  if (!input.isActive) {
    await query(sql`DELETE FROM sessions WHERE user_id = ${person.id}`);
  }
  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: input.isActive ? "staff.allow" : "staff.block",
    entityType: "user",
    entityId: person.id,
  });
}

export async function setStaffRole(input: { userId: string; actorUserId: string; role: RoleSlug }) {
  if (!(ROLE_SLUGS as readonly string[]).includes(input.role)) {
    throw new Error("Unknown job");
  }
  const person = await getStaffById(input.userId);
  if (!person) throw new Error("Staff not found");
  await assertNotLastOwner({
    userId: person.id,
    roles: person.roles,
    nextActive: person.isActive,
    nextRole: input.role,
  });
  await query(sql`DELETE FROM user_roles WHERE user_id = ${person.id}`);
  await query(sql`INSERT INTO user_roles (user_id, role_slug) VALUES (${person.id}, ${input.role})`);
  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: "staff.role",
    entityType: "user",
    entityId: person.id,
    metadata: { role: input.role },
  });
}

export async function setStaffPassword(input: { userId: string; actorUserId: string; password: string }) {
  if (input.password.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }
  const passwordHash = await hashPassword(input.password);
  await query(sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${input.userId}`);
  await query(sql`DELETE FROM sessions WHERE user_id = ${input.userId}`);
  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: "staff.password",
    entityType: "user",
    entityId: input.userId,
  });
}

export async function canShowBlock(person: StaffListItem, actorId: string): Promise<boolean> {
  if (person.id === actorId) return false;
  if (person.isActive && person.roles.includes("super_admin")) {
    return (await countActiveOwners(person.id)) >= 1;
  }
  return true;
}
