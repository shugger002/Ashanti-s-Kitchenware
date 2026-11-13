export const ROLE_SLUGS = [
  "super_admin",
  "store_admin",
  "inventory_manager",
  "order_manager",
  "developer",
] as const;

export const SHOP_ROLE_SLUGS = [
  "super_admin",
  "store_admin",
  "inventory_manager",
  "order_manager",
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  roles: RoleSlug[];
};

export const PERMISSIONS = {
  "products.write": ["super_admin", "store_admin", "developer"],
  "products.read": ["super_admin", "store_admin", "inventory_manager", "developer"],
  "inventory.write": ["super_admin", "store_admin", "inventory_manager", "developer"],
  "orders.write": ["super_admin", "store_admin", "order_manager", "developer"],
  "orders.read": ["super_admin", "store_admin", "order_manager", "inventory_manager", "developer"],
  "customers.read": ["super_admin", "store_admin", "order_manager", "developer"],
  "reports.read": ["super_admin", "store_admin", "developer"],
  "settings.write": ["super_admin", "store_admin", "developer"],
  "users.write": ["super_admin", "developer"],
  "payments.capture": ["super_admin", "store_admin", "developer"],
  "ops.write": ["developer"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

function collectRoleTokens(value: unknown, into: string[]) {
  if (value == null || value === "") return;
  if (Array.isArray(value)) {
    for (const item of value) collectRoleTokens(item, into);
    return;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    collectRoleTokens(record.role_slug ?? record.slug ?? record.role, into);
    return;
  }
  String(value)
    .replace(/[{}"']/g, " ")
    .split(/[\s,]+/)
    .filter(Boolean)
    .forEach((token) => into.push(token));
}

export function normalizeAdminRoles(value: unknown): RoleSlug[] {
  const tokens: string[] = [];
  collectRoleTokens(value, tokens);
  const seen = new Set<RoleSlug>();
  for (const token of tokens) {
    if ((ROLE_SLUGS as readonly string[]).includes(token)) seen.add(token as RoleSlug);
  }
  return [...seen];
}

export function hasPermission(roles: unknown, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly RoleSlug[] | undefined;
  if (!allowed) return false;
  return normalizeAdminRoles(roles).some((role) => allowed.includes(role));
}

export function isDeveloper(roles: unknown) {
  const list = normalizeAdminRoles(roles);
  return list.includes("developer") || hasPermission(list, "ops.write");
}

export function deskHome(roles: unknown) {
  if (hasPermission(roles, "orders.read") || isDeveloper(roles)) return "/admin" as const;
  return "/admin" as const;
}
