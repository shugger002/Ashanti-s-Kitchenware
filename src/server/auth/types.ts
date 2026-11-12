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
  "products.write": ["super_admin", "store_admin"],
  "products.read": ["super_admin", "store_admin", "inventory_manager"],
  "inventory.write": ["super_admin", "store_admin", "inventory_manager"],
  "orders.write": ["super_admin", "store_admin", "order_manager"],
  "orders.read": ["super_admin", "store_admin", "order_manager", "inventory_manager"],
  "customers.read": ["super_admin", "store_admin", "order_manager"],
  "reports.read": ["super_admin", "store_admin"],
  "settings.write": ["super_admin", "store_admin"],
  "users.write": ["super_admin"],
  "payments.capture": ["super_admin", "store_admin"],
  "ops.write": ["developer"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(roles: RoleSlug[], permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly RoleSlug[] | undefined;
  if (!allowed) return false;
  return roles.some((role) => allowed.includes(role));
}

export function normalizeAdminRoles(value: unknown): RoleSlug[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.replace(/[{}]/g, "").split(",")
      : [];
  return raw
    .map((role) => String(role).trim())
    .filter((role): role is RoleSlug => (ROLE_SLUGS as readonly string[]).includes(role));
}

export function isDeveloper(roles: RoleSlug[]) {
  return roles.includes("developer") || hasPermission(roles, "ops.write");
}
