export const ROLE_SLUGS = [
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
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(roles: RoleSlug[], permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly RoleSlug[];
  return roles.some((role) => allowed.includes(role));
}
