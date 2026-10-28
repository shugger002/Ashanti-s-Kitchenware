"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  ClipboardList,
  FolderTree,
  Home,
  Menu,
  Package,
  PanelLeft,
  Percent,
  Plus,
  Settings,
  TicketPercent,
  Truck,
  UserPlus,
  Users,
  Warehouse,
  X,
  Contact,
} from "lucide-react";
import { logoutAdmin } from "@/app/admin/logout/action";
import { brand } from "@/config/brand";
import type { AdminUser, Permission } from "@/server/auth/types";
import { hasPermission } from "@/server/auth/types";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  permission: Permission;
  icon: typeof Home;
  exact?: boolean;
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Desk",
    items: [
      { href: "/admin", label: "Home", permission: "orders.read", icon: Home, exact: true },
      { href: "/admin/orders", label: "Orders", permission: "orders.read", icon: ClipboardList },
      { href: "/admin/products", label: "Edit products", permission: "products.read", icon: Package },
      { href: "/admin/products/new", label: "Add product", permission: "products.write", icon: Plus, exact: true },
      { href: "/admin/inventory", label: "Stock", permission: "inventory.write", icon: Warehouse },
      { href: "/admin/categories", label: "Categories", permission: "products.write", icon: FolderTree },
    ],
  },
  {
    label: "Selling",
    items: [
      { href: "/admin/promotions", label: "Discounts", permission: "products.write", icon: Percent },
      { href: "/admin/coupons", label: "Coupons", permission: "products.write", icon: TicketPercent },
      { href: "/admin/customers", label: "Customers", permission: "customers.read", icon: Contact },
    ],
  },
  {
    label: "Shop",
    items: [
      { href: "/admin/analytics", label: "Analytics", permission: "reports.read", icon: BarChart3 },
      { href: "/admin/delivery", label: "Delivery", permission: "settings.write", icon: Truck },
      { href: "/admin/services", label: "Connections", permission: "settings.write", icon: Activity },
      { href: "/admin/settings", label: "Settings", permission: "settings.write", icon: Settings },
    ],
  },
  {
    label: "Staff",
    items: [
      { href: "/admin/users", label: "Staff", permission: "users.write", icon: Users },
      { href: "/admin/users/new", label: "Add staff", permission: "users.write", icon: UserPlus, exact: true },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact || item.href === "/admin") return pathname === item.href;
  if (item.href === "/admin/products") {
    return (
      pathname === "/admin/products" ||
      (pathname.startsWith("/admin/products/") &&
        pathname !== "/admin/products/new" &&
        !pathname.startsWith("/admin/products/discounts"))
    );
  }
  if (item.href === "/admin/promotions") {
    return pathname === "/admin/promotions" || pathname.startsWith("/admin/products/discounts");
  }
  if (item.href === "/admin/users") {
    return pathname === "/admin/users" || (pathname.startsWith("/admin/users/") && pathname !== "/admin/users/new");
  }
  if (item.href === "/admin/analytics") {
    return pathname === "/admin/analytics" || pathname.startsWith("/admin/reports");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const AUTH_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

function initials(user: AdminUser) {
  const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

function Nav({
  user,
  collapsed,
  onNavigate,
  showLogoCard = true,
}: {
  user: AdminUser;
  collapsed: boolean;
  onNavigate?: () => void;
  showLogoCard?: boolean;
}) {
  const pathname = usePathname();
  return (
    <>
      <Link
        href="/admin"
        className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-2")}
        onClick={() => onNavigate?.()}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-accent">
          AK
        </span>
        {collapsed ? null : (
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">{brand.name}</span>
            <span className="block text-[11px] text-white/70">Shop desk</span>
          </span>
        )}
      </Link>
      {!collapsed && showLogoCard ? (
        <div className="mx-4 mb-4 rounded-sm bg-white px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoSrc} alt="" className="h-7 w-auto max-w-[9rem] object-contain brightness-0" />
        </div>
      ) : null}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4" aria-label="Admin">
        {groups.map((group) => {
          const items = group.items.filter((item) => hasPermission(user.roles, item.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              {collapsed ? null : (
                <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/60">
                  {group.label}
                </p>
              )}
              <div className={cn("flex flex-col gap-0.5 text-sm", collapsed && "items-center")}>
                {items.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(pathname, link);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch
                      title={link.label}
                      onClick={() => onNavigate?.()}
                      className={cn(
                        "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2",
                        collapsed && "size-10 min-h-10 justify-center px-0",
                        active ? "bg-white text-accent" : "text-white/85 hover:bg-white/15 hover:text-white",
                      )}
                    >
                      <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} strokeWidth={1.5} />
                      {collapsed ? <span className="sr-only">{link.label}</span> : link.label}
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("ak_admin_nav_collapsed") === "1");
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return children;
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("ak_admin_nav_collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function signOut() {
    await logoutAdmin();
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-dvh">
      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col bg-accent text-white lg:hidden">
            <div className="flex items-center justify-between px-3 pt-2">
              <p className="px-1 text-sm font-medium text-white">Menu</p>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-lg text-white hover:bg-white/15"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Nav user={user} collapsed={false} showLogoCard={false} onNavigate={() => setMenuOpen(false)} />
            <div className="border-t border-white/20 px-4 py-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-medium">
                  {initials(user)}
                </span>
                <span className="min-w-0">
                  <p className="truncate">{user.fullName || user.email}</p>
                  <p className="truncate text-xs text-white/70">{user.email}</p>
                </span>
              </div>
              <div className="mt-3 flex flex-col items-start gap-1">
                <Link href="/" className="inline-flex min-h-11 items-center text-white/80 hover:text-white">
                  View store
                </Link>
                <button type="button" className="inline-flex min-h-11 items-center text-white/80 hover:text-white" onClick={signOut}>
                  Sign out
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}

      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col bg-accent text-white lg:flex",
          collapsed ? "w-[4.25rem]" : "w-60",
        )}
      >
        <Nav user={user} collapsed={collapsed} />
        <div className={cn("border-t border-white/20 py-4 text-sm", collapsed ? "px-2" : "px-4")}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-medium">
              {initials(user)}
            </span>
            {collapsed ? null : (
              <span className="min-w-0">
                <p className="truncate">{user.fullName || user.email}</p>
                <p className="truncate text-xs text-white/70">{user.email}</p>
              </span>
            )}
          </div>
          {collapsed ? null : (
            <div className="mt-3 flex flex-col items-start gap-1.5 text-xs">
              <Link href="/" className="text-white/80 hover:text-white">
                View store
              </Link>
              <button type="button" className="text-white/80 hover:text-white" onClick={signOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>
      <div className="admin-desk-paper">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-white px-3 lg:hidden">
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoSrc} alt={brand.name} className="h-7 w-auto max-w-[8.5rem] object-contain brightness-0" />
          <Link href="/" className="ml-auto inline-flex min-h-11 items-center text-sm text-accent">
            Store
          </Link>
        </header>
        <div className="sticky top-0 z-30 hidden h-12 items-center border-b border-border bg-white px-3 lg:flex">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md text-accent hover:bg-accent/10"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 pb-12 sm:px-8 sm:py-10">{children}</div>
      </div>
    </div>
  );
}
