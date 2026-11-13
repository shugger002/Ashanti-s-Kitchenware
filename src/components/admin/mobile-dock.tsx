"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardList, Home, Package, Settings } from "lucide-react";
import type { AdminUser } from "@/server/auth/types";
import { hasPermission, isDeveloper, normalizeAdminRoles } from "@/server/auth/types";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Home", icon: Home, permission: "orders.read" as const, exact: true },
  { href: "/admin", label: "Home", icon: Home, permission: "ops.write" as const, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, permission: "orders.read" as const },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products.read" as const },
  { href: "/admin/ops", label: "Ops", icon: Activity, permission: "ops.write" as const },
  { href: "/admin/settings", label: "Shop", icon: Settings, permission: "settings.write" as const },
];

export function AdminMobileDock({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const roles = normalizeAdminRoles(user.roles);
  const visible: typeof items = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!hasPermission(roles, item.permission) || seen.has(item.href)) continue;
    seen.add(item.href);
    visible.push(item);
  }
  if (visible.length === 0 && isDeveloper(roles)) {
    visible.push({ href: "/admin/ops", label: "Ops", icon: Activity, permission: "ops.write" as const });
  }
  if (visible.length === 0) return null;
  return (
    <nav
      aria-label="Desk shortcuts"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul
        className={
          visible.length >= 5 ? "grid grid-cols-5" : visible.length === 4 ? "grid grid-cols-4" : "grid grid-cols-3"
        }
      >
        {visible.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <Icon className="size-5" strokeWidth={1.6} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
