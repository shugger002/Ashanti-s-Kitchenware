"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  ClipboardList,
  Home,
  Menu,
  Package,
  PanelLeft,
  Percent,
  Plus,
  Settings,
  TicketPercent,
  UserPlus,
  Users,
  X,
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
    label: "Overview",
    items: [
      { href: "/admin", label: "Home", permission: "orders.read", icon: Home, exact: true },
      { href: "/admin/products", label: "Products", permission: "products.read", icon: Package },
      { href: "/admin/products/new", label: "Add Product", permission: "products.write", icon: Plus, exact: true },
      { href: "/admin/promotions", label: "Discounts", permission: "products.write", icon: Percent },
      { href: "/admin/coupons", label: "Coupons", permission: "products.write", icon: TicketPercent },
      { href: "/admin/orders", label: "Orders", permission: "orders.read", icon: ClipboardList },
      { href: "/admin/analytics", label: "Analytics", permission: "reports.read", icon: BarChart3 },
      { href: "/admin/services", label: "Service Health", permission: "settings.write", icon: Activity },
    ],
  },
  {
    label: "User Management",
    items: [
      { href: "/admin/users", label: "Users", permission: "users.write", icon: Users },
      { href: "/admin/users/new", label: "Add Users", permission: "users.write", icon: UserPlus, exact: true },
    ],
  },
  {
    label: "Settings",
    items: [{ href: "/admin/settings", label: "Settings", permission: "settings.write", icon: Settings }],
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
      <a
        href="/admin"
        className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-2")}
        onClick={onNavigate}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-accent">
          AK
        </span>
        {collapsed ? null : (
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">{brand.name}</span>
            <span className="block text-[11px] text-white/70">Admin Portal</span>
          </span>
        )}
      </a>
      {!collapsed && showLogoCard ? (
        <div className="mx-4 mb-4 rounded-sm bg-white px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoSrc} alt="" className="h-7 w-auto max-w-[9rem] object-contain brightness-0" />
        </div>
      ) : null}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4" aria-label="Admin">
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
                    <a
                      key={link.href}
                      href={link.href}
                      title={link.label}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2",
                        collapsed && "size-10 justify-center px-0",
                        active ? "bg-white text-accent" : "text-white/85 hover:bg-white/15 hover:text-white",
                      )}
                    >
                      <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} strokeWidth={1.5} />
                      {collapsed ? <span className="sr-only">{link.label}</span> : link.label}
                    </a>
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
        <button
          type="button"
          className="fixed inset-0 z-20 bg-foreground/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "sticky top-0 z-30 flex h-dvh shrink-0 flex-col bg-accent text-white lg:hidden",
          menuOpen ? "w-60" : "w-[3.75rem]",
        )}
      >
        <button
          type="button"
          className={cn(
            "mt-2 inline-flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/15",
            menuOpen ? "ml-3" : "mx-auto",
          )}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Nav
          user={user}
          collapsed={!menuOpen}
          showLogoCard={false}
          onNavigate={() => setMenuOpen(false)}
        />
        <div className={cn("border-t border-white/20 py-4 text-sm", menuOpen ? "px-4" : "px-2")}>
          <div className={cn("flex items-center gap-3", !menuOpen && "justify-center")}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-medium">
              {initials(user)}
            </span>
            {menuOpen ? (
              <span className="min-w-0">
                <p className="truncate">{user.fullName || user.email}</p>
                <p className="truncate text-xs text-white/70">{user.email}</p>
              </span>
            ) : null}
          </div>
          {menuOpen ? (
            <button type="button" className="mt-3 text-xs text-white/80" onClick={signOut}>
              Sign out
            </button>
          ) : null}
        </div>
      </aside>

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
      <div className="relative min-h-dvh min-w-0 flex-1 bg-transparent">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/admin/kitchen-wall.jpg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-white/60" />
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-white px-4 py-3 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoSrc} alt={brand.name} className="h-8 w-auto max-w-[9rem] object-contain brightness-0" />
          <Link href="/" className="ml-auto text-sm text-accent">
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
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9">{children}</div>
      </div>
    </div>
  );
}
