import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { readSessionUser } from "@/server/auth/session";
import { dashboardMetrics } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { paymentsAreReady } from "@/server/payments";
import {
  adminButton,
  AdminPageHeader,
  EmptyState,
  orderTone,
  paymentLabel,
  paymentTone,
  StatusPill,
} from "@/components/admin/ui";

export default async function AdminHomePage() {
  await requirePermission("orders.read");
  const [metrics, user] = await Promise.all([dashboardMetrics(), readSessionUser()]);
  const pending = Number(metrics.pending_orders);
  const packing = Number(metrics.packing_orders);
  const ready = Number(metrics.ready_to_pack);
  const out = Number(metrics.out_for_delivery);
  const low = Number(metrics.lowStock);
  const soldOut = Number(metrics.outOfStock);
  const demo = Number(metrics.demoListings);
  const promo = Number(metrics.promoListings);
  const greeting = (user?.fullName ?? "Admin").trim() || "Admin";

  const kpis = [
    { href: "/admin/products", label: "Total Products", value: metrics.total_products },
    { href: "/admin/promotions", label: "On Discount", value: String(promo) },
    { href: "/admin/orders?status=pending_payment", label: "Pending Orders", value: metrics.pending_orders },
    { href: "/admin/analytics", label: "Revenue (Paid)", value: formatGhs(Number(metrics.revenue)) },
    { href: "/admin/orders", label: "Today Orders", value: metrics.today_orders },
    { href: "/admin/analytics", label: "Today Revenue", value: formatGhs(Number(metrics.today_revenue)) },
    { href: "/admin/orders", label: "Fulfilled Today", value: metrics.fulfilled_today },
    { href: "/admin/customers", label: "New Customers Today", value: metrics.new_customers_today },
  ];

  const work = [
    {
      href: "/admin/orders?status=pending_payment",
      label: "Waiting for payment",
      value: pending,
      hint: pending === 0 ? "Clear" : "Open these first",
    },
    {
      href: "/admin/orders?status=paid",
      label: "Ready to pack",
      value: ready,
      hint: ready === 0 ? "Clear" : "Paid — move to Packaging order",
    },
    {
      href: "/admin/orders?status=packing",
      label: "Packaging order",
      value: packing,
      hint: packing === 0 ? "Clear" : "Then mark Out for Delivery or ready at the shop",
    },
    {
      href: "/admin/orders?status=shipped",
      label: "Out for delivery",
      value: out,
      hint: out === 0 ? "Clear" : "Confirm on WhatsApp, then mark delivered",
    },
    {
      href: "/admin/inventory",
      label: "Low / out of stock",
      value: low + soldOut,
      hint: low + soldOut === 0 ? "Clear" : `${low} low · ${soldOut} out`,
    },
  ];

  const quick = [
    { href: "/admin/orders", label: "Open Orders" },
    { href: "/admin/inventory", label: "Manage Inventory" },
    { href: "/admin/products/new", label: "Add Product" },
    { href: "/admin/promotions", label: "Manage Discounts" },
    { href: "/admin/orders", label: "Track Orders" },
    { href: "/admin/analytics", label: "Open Analytics" },
    { href: "/admin/services", label: "Service Health" },
  ];

  return (
    <div>
      <AdminPageHeader
        title={`Welcome, ${greeting}!`}
        description="Manage your application settings and content here."
        action={
          <>
            <Link href="/admin/products/new" className="text-sm text-accent">
              New product
            </Link>
            <Link href="/admin/orders" className={adminButton()}>
              Orders
            </Link>
          </>
        }
      />

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="block rounded-2xl border border-border bg-background p-5">
              <p className="text-xs text-muted">{item.label}</p>
              <p className="mt-2 font-serif text-3xl tabular-nums">{item.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {work.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className={`block rounded-2xl border bg-background p-5 ${
                item.value > 0 ? "border-accent" : "border-border"
              }`}
            >
              <p className="text-xs text-muted">{item.label}</p>
              <p className={`mt-2 font-serif text-3xl tabular-nums ${item.value > 0 ? "text-accent" : ""}`}>
                {item.value}
              </p>
              <p className="mt-2 text-xs text-muted">{item.hint}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-accent">
              All orders
            </Link>
          </div>
          {metrics.recent.length === 0 ? (
            <EmptyState
              title="No tickets yet"
              body="When a customer completes checkout, the order appears here with a reference you can pack against."
              action={
                <Link href="/admin/products" className="text-sm text-accent">
                  Check the catalogue
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {metrics.recent.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex items-start justify-between gap-3 py-3">
                    <span>
                      <span className="block font-medium">{order.full_name}</span>
                      <span className="mt-0.5 block text-xs text-muted">{order.public_ref}</span>
                    </span>
                    <span className="text-right">
                      <StatusPill
                        value={order.payment_status === "paid" ? order.status : order.payment_status}
                        tone={
                          order.payment_status === "paid" ? orderTone(order.status) : paymentTone(order.payment_status)
                        }
                        label={
                          order.payment_status === "paid"
                            ? undefined
                            : paymentLabel(order.payment_status).toUpperCase()
                        }
                      />
                      <span className="mt-1 block text-sm tabular-nums">{formatGhs(Number(order.total))}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Quick actions</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {quick.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="block rounded-lg px-2 py-1.5 hover:bg-surface">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4 text-sm">
            <p className="text-xs text-muted">Online payment keys</p>
            <p className="mt-1 font-medium">
              {paymentsAreReady() ? "Hubtel or Moolre is configured" : "Not configured — staff can still record a verified payment"}
            </p>
          </div>
          <Link href="/admin/promotions" className="block rounded-2xl border border-border bg-background p-4 text-sm">
            <p className="text-xs text-muted">Promo listings</p>
            <p className="mt-1 font-medium">{promo} on the storefront popup</p>
          </Link>
          <Link href="/admin/products?q=DEMO" className="block rounded-2xl border border-border bg-background p-4 text-sm">
            <p className="text-xs text-muted">Demo SKUs</p>
            <p className={`mt-1 font-medium ${demo > 0 ? "text-accent" : ""}`}>
              {demo > 0 ? `${demo} still labelled DEMO — unpublish before launch` : "None"}
            </p>
          </Link>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="text-xl">Paid bestsellers</h2>
        <p className="mt-1 text-sm text-muted">From paid, non-cancelled orders only.</p>
        {metrics.bestSellers.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No ranking yet" body="Ranks appear after the first paid, non-cancelled order." />
          </div>
        ) : (
          <ol className="mt-4 divide-y divide-border rounded-2xl border border-border bg-background">
            {metrics.bestSellers.map((row, index) => (
              <li key={row.product_name} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span>
                  <span className="mr-3 tabular-nums text-muted">{index + 1}</span>
                  {row.product_name}
                </span>
                <span className="tabular-nums text-muted">
                  {row.units} sold · {formatGhs(Number(row.revenue))}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
