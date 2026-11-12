"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardList, Home, Package, Settings } from "lucide-react";
import type { AdminUser } from "@/server/auth/types";
import { hasPermission } from "@/server/auth/types";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Home", icon: Home, permission: "orders.read" as const, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, permission: "orders.read" as const },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products.read" as const },
  { href: "/admin/ops", label: "Ops", icon: Activity, permission: "settings.write" as const },
  { href: "/admin/settings", label: "Shop", icon: Settings, permission: "settings.write" as const },
];

export function AdminMobileDock({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const visible = items.filter((item) => hasPermission(user.roles, item.permission));
  if (visible.length === 0) return null;
  return (
    <nav
      aria-label="Desk shortcuts"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
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
