"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutGrid,
  Menu,
  Package,
  Percent,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { logoutAdmin } from "@/app/admin/logout/action";
import { brand } from "@/config/brand";
import type { AdminUser } from "@/server/auth/types";
import { hasPermission } from "@/server/auth/types";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Floor",
    items: [
      { href: "/admin", label: "Overview", permission: "orders.read" as const, icon: LayoutGrid },
      { href: "/admin/orders", label: "Orders", permission: "orders.read" as const, icon: ClipboardList },
      { href: "/admin/products", label: "Products", permission: "products.read" as const, icon: Package },
      { href: "/admin/inventory", label: "Inventory", permission: "inventory.write" as const, icon: Warehouse },
    ],
  },
  {
    label: "Shop",
    items: [
      { href: "/admin/categories", label: "Categories", permission: "products.write" as const, icon: Boxes },
      { href: "/admin/promotions", label: "Promotions", permission: "products.write" as const, icon: Percent },
      { href: "/admin/customers", label: "Customers", permission: "customers.read" as const, icon: ShoppingBag },
    ],
  },
  {
    label: "Office",
    items: [
      { href: "/admin/delivery", label: "Delivery", permission: "settings.write" as const, icon: Truck },
      { href: "/admin/reports", label: "Reports", permission: "reports.read" as const, icon: BarChart3 },
      { href: "/admin/settings", label: "Settings", permission: "settings.write" as const, icon: Settings },
      { href: "/admin/users", label: "Staff", permission: "users.write" as const, icon: Users },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const AUTH_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

function Nav({ user, onNavigate }: { user: AdminUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <Link href="/admin" className="flex flex-col gap-2 px-5 py-5" onClick={onNavigate}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logoSrc} alt="" className="h-9 w-auto max-w-[9rem] object-contain brightness-0 invert" />
        <span className="text-[11px] uppercase tracking-[0.16em] text-background/55">Desk</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4" aria-label="Admin">
        {groups.map((group) => {
          const items = group.items.filter((item) => hasPermission(user.roles, item.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-background/45">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5 text-sm">
                {items.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2",
                        active ? "bg-accent text-white" : "text-background/75 hover:bg-white/10 hover:text-background",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </>
  );
}

export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  if (AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return children;
  }

  async function signOut() {
    await logoutAdmin();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-surface lg:flex">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3 lg:hidden">
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logoSrc} alt={brand.name} className="h-8 w-auto max-w-[9rem] object-contain dark:invert" />
        <Link href="/" className="ml-auto text-sm text-accent">
          Store
        </Link>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-foreground/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex h-full w-[min(18rem,86vw)] flex-col bg-foreground text-background">
            <Nav user={user} onNavigate={() => setMenuOpen(false)} />
            <div className="border-t border-white/10 px-5 py-4 text-sm">
              <p className="truncate">{user.fullName || user.email}</p>
              <button type="button" className="mt-2 text-xs text-background/80" onClick={signOut}>
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-foreground text-background lg:flex">
        <Nav user={user} />
        <div className="border-t border-white/10 px-5 py-4 text-sm">
          <p className="truncate text-background">{user.fullName || user.email}</p>
          <p className="truncate text-xs text-background/50">{user.email}</p>
          <div className="mt-3 flex flex-col items-start gap-1.5 text-xs">
            <Link href="/" className="text-background/80 hover:text-background">
              View store
            </Link>
            <button type="button" className="text-background/80 hover:text-background" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9">{children}</div>
      </div>
    </div>
  );
}
