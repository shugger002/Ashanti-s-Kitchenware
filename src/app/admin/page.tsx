import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { dashboardMetrics } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { hasPermission } from "@/server/auth/types";
import {
  AdminPageHeader,
  EmptyState,
  liveOrderBadge,
  paymentTone,
  StatusPill,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils";

function count(value: string | undefined) {
  return Number(value ?? 0);
}

export default async function AdminHomePage() {
  const [metrics, user] = await Promise.all([dashboardMetrics(), requirePermission("orders.read")]);
  const greeting = (user?.fullName ?? "Staff").trim().split(/\s+/)[0] || "Staff";
  const canProducts = hasPermission(user.roles, "products.read");
  const canInventory = hasPermission(user.roles, "inventory.write");
  const canReports = hasPermission(user.roles, "reports.read");

  const queue = [
    {
      href: "/admin/orders?status=pending_payment",
      label: "Waiting on payment",
      value: count(metrics.pending_orders),
      hint: "Order received, unpaid",
    },
    {
      href: "/admin/orders?status=paid",
      label: "Ready to pack",
      value: count(metrics.ready_to_pack),
      hint: "Paid, still on the desk",
    },
    {
      href: "/admin/orders?status=packing",
      label: "Packing",
      value: count(metrics.packing_orders),
      hint: "In the bag",
    },
    {
      href: "/admin/orders?status=shipped",
      label: "Out for delivery",
      value: count(metrics.out_for_delivery),
      hint: "Quoted on WhatsApp",
    },
  ];

  const stock = [
    canInventory
      ? { href: "/admin/inventory", label: "Low stock", value: count(metrics.lowStock), warn: count(metrics.lowStock) > 0 }
      : null,
    canInventory
      ? { href: "/admin/inventory", label: "Out of stock", value: count(metrics.outOfStock), warn: count(metrics.outOfStock) > 0 }
      : null,
    canProducts
      ? { href: "/admin/products", label: "Demo listings", value: count(metrics.demoListings), warn: count(metrics.demoListings) > 0 }
      : null,
    canProducts
      ? { href: "/admin/promotions", label: "On promo", value: count(metrics.promoListings), warn: false }
      : null,
  ].filter(Boolean) as { href: string; label: string; value: number; warn: boolean }[];

  const canCustomers = hasPermission(user.roles, "customers.read");
  const today = [
    { href: "/admin/orders", label: "Orders today", value: String(count(metrics.today_orders)) },
    {
      href: canReports ? "/admin/analytics" : "/admin/orders",
      label: "Paid today",
      value: formatGhs(Number(metrics.today_revenue)),
    },
    { href: "/admin/orders", label: "Fulfilled today", value: String(count(metrics.fulfilled_today)) },
    {
      href: canCustomers ? "/admin/customers" : "/admin",
      label: "New customers",
      value: String(count(metrics.new_customers_today)),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={`${greeting}, Accra desk`}
        description="What needs a hand now: unpaid tickets, packing, stock, and demo SKUs still on the shop."
      />

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Work now</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
          {queue.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "block min-h-24 rounded-xl border bg-white/95 p-4 shadow-sm",
                  item.value > 0 ? "border-accent" : "border-border",
                )}
              >
                <p className="text-xs text-muted">{item.label}</p>
                <p className={cn("mt-2 text-3xl font-medium tabular-nums", item.value > 0 && "text-accent")}>
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted">{item.hint}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {stock.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-muted">Catalogue</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
            {stock.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-xl border bg-white/95 p-4 shadow-sm",
                    item.warn ? "border-accent" : "border-border",
                  )}
                >
                  <p className="text-xs text-muted">{item.label}</p>
                  <p className={cn("mt-2 text-2xl font-medium tabular-nums", item.warn && "text-accent")}>{item.value}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Today (Accra)</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
          {today.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="block rounded-xl border border-border bg-white/95 p-4 shadow-sm">
                <p className="text-xs text-muted">{item.label}</p>
                <p className="mt-2 text-xl font-medium tabular-nums">{item.value}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-white/95 p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Recent orders</h2>
          <Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm text-accent">
            All orders
          </Link>
        </div>
        {metrics.recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No tickets yet" body="When a customer completes checkout, the order appears here." />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {metrics.recent.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex min-h-14 items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{order.full_name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{order.public_ref}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <StatusPill
                      value={liveOrderBadge(order.payment_status, order.status)}
                      tone={order.payment_status === "paid" ? "ok" : paymentTone(order.payment_status)}
                    />
                    <span className="mt-1 block text-sm tabular-nums">{formatGhs(Number(order.total))}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {metrics.bestSellers.length > 0 ? (
        <section className="mt-6 rounded-xl border border-border bg-white/95 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-medium">Selling (paid)</h2>
          <ul className="mt-3 space-y-2">
            {metrics.bestSellers.map((row) => (
              <li key={row.product_name} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{row.product_name}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {row.units} · {formatGhs(Number(row.revenue))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
