import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { readSessionUser } from "@/server/auth/session";
import { dashboardMetrics } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import {
  AdminPageHeader,
  EmptyState,
  liveOrderBadge,
  paymentTone,
  StatusPill,
} from "@/components/admin/ui";

export default async function AdminHomePage() {
  await requirePermission("orders.read");
  const [metrics, user] = await Promise.all([dashboardMetrics(), readSessionUser()]);
  const greeting = (user?.fullName ?? "Admin").trim() || "Admin";

  const kpis = [
    { href: "/admin/products", label: "Total Products", value: metrics.total_products },
    { href: "/admin/promotions", label: "On Discount", value: metrics.promoListings },
    { href: "/admin/orders?status=pending_payment", label: "Pending Orders", value: metrics.pending_orders },
    { href: "/admin/analytics", label: "Revenue (Paid)", value: formatGhs(Number(metrics.revenue)) },
    { href: "/admin/orders", label: "Today Orders", value: metrics.today_orders },
    { href: "/admin/analytics", label: "Today Revenue", value: formatGhs(Number(metrics.today_revenue)) },
    { href: "/admin/orders", label: "Fulfilled Today", value: metrics.fulfilled_today },
    { href: "/admin/settings", label: "New Customers Today", value: metrics.new_customers_today },
  ];

  const quick = [
    { href: "/admin/orders", label: "Open Orders" },
    { href: "/admin/products", label: "Manage Inventory" },
    { href: "/admin/products/new", label: "Add Product" },
    { href: "/admin/promotions", label: "Manage Discounts" },
    { href: "/admin/orders", label: "Track Orders" },
    { href: "/admin/analytics", label: "Open Analytics" },
    { href: "/admin/services", label: "Service Health" },
  ];

  return (
    <div>
      <AdminPageHeader
        align="center"
        title={`Welcome, ${greeting}!`}
        description="Manage your application settings and content here."
      />

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="block rounded-xl border border-border bg-white p-5 text-foreground">
              <p className="text-sm text-muted">{item.label}</p>
              <p className="mt-3 text-3xl font-medium tabular-nums">{item.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-xl border border-border bg-white p-5">
        <h2 className="text-lg font-medium">Recent Orders</h2>
        {metrics.recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No tickets yet"
              body="When a customer completes checkout, the order appears here."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {metrics.recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <span>
                    <span className="block font-medium">{order.full_name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{order.public_ref}</span>
                  </span>
                  <span className="text-right">
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

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quick.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="block rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium hover:bg-accent/5"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
