import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { dashboardMetrics } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { customerWhatsAppHref, formatOrderAddress, packLines } from "@/lib/order-whatsapp";
import { hasPermission } from "@/server/auth/types";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import {
  AdminPageHeader,
  AdminSection,
  AdminStat,
  EmptyState,
  liveOrderBadge,
  paymentTone,
  StatusPill,
} from "@/components/admin/ui";

function count(value: string | undefined) {
  return Number(value ?? 0);
}

export default async function AdminHomePage() {
  const [metrics, user] = await Promise.all([dashboardMetrics(), requirePermission("orders.read")]);
  const firstName = (user?.fullName ?? "").trim().split(/\s+/)[0] || "";
  const greeting = /^(store|admin|staff|owner)$/i.test(firstName) ? "Accra desk" : `${firstName || "Staff"}, Accra desk`;
  const canProducts = hasPermission(user.roles, "products.read");
  const canInventory = hasPermission(user.roles, "inventory.write");
  const canReports = hasPermission(user.roles, "reports.read");

  const queue = [
    {
      href: "/admin/orders?status=pending_payment",
      label: "Waiting on payment",
      value: count(metrics.pending_orders),
      hint: "Not paid yet",
    },
    {
      href: "/admin/orders?status=paid",
      label: "Ready to pack",
      value: count(metrics.ready_to_pack),
      hint: "Paid, not packed yet",
    },
    {
      href: "/admin/orders?status=packing",
      label: "Packing",
      value: count(metrics.packing_orders),
      hint: "Being packed",
    },
    {
      href: "/admin/orders?status=shipped",
      label: "Out for delivery",
      value: count(metrics.out_for_delivery),
      hint: "On the way",
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
      ? { href: "/admin/products", label: "Sample products", value: count(metrics.demoListings), warn: count(metrics.demoListings) > 0 }
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
    { href: "/admin/orders", label: "Delivered today", value: String(count(metrics.fulfilled_today)) },
    {
      href: canCustomers ? "/admin/customers" : "/admin",
      label: "New customers",
      value: String(count(metrics.new_customers_today)),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={greeting}
        description="Orders to pack, stock that is low, and anything still waiting."
      />

      <section className="mt-8">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Work now</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {queue.map((item) => (
            <li key={item.label}>
              <AdminStat href={item.href} label={item.label} value={item.value} hint={item.hint} warn={item.value > 0} />
            </li>
          ))}
        </ul>
      </section>

      {stock.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Products</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stock.map((item) => (
              <li key={item.label}>
                <AdminStat href={item.href} label={item.label} value={item.value} warn={item.warn} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Today (Accra)</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {today.map((item) => (
            <li key={item.label}>
              <AdminStat href={item.href} label={item.label} value={item.value} />
            </li>
          ))}
        </ul>
      </section>

      <AdminSection className="mt-8" title="Recent orders">
        <div className="-mt-2 flex justify-end">
          <Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm text-accent">
            All orders
          </Link>
        </div>
        {metrics.recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No orders yet" body="When a customer finishes checkout, the order shows here." />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {metrics.recent.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const wa = customerWhatsAppHref({
                phone: order.phone,
                publicRef: order.public_ref,
                fullName: order.full_name,
                items,
                totalLabel: formatGhs(Number(order.total)),
                deliveryMethod: order.delivery_method,
                address: formatOrderAddress([order.address_line1, order.address_line2, order.city, order.region]),
                deliveryNote: order.delivery_instructions ?? undefined,
              });
              return (
                <li key={order.id} className="space-y-2 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="flex min-h-11 items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{order.full_name}</span>
                      <span className="mt-0.5 block text-xs text-muted">{order.public_ref}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-neutral-800">{packLines(items)}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <StatusPill
                        value={liveOrderBadge(order.payment_status, order.status)}
                        tone={order.payment_status === "paid" ? "ok" : paymentTone(order.payment_status)}
                      />
                      <span className="mt-1 block text-sm tabular-nums">{formatGhs(Number(order.total))}</span>
                    </span>
                  </Link>
                  {wa ? <OrderWhatsAppLink href={wa} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </AdminSection>

      {metrics.bestSellers.length > 0 ? (
        <AdminSection className="mt-8" title="Best sellers">
          <ul className="space-y-3">
            {metrics.bestSellers.map((row) => (
              <li key={row.product_name} className="flex items-baseline justify-between gap-3 border-b border-[color-mix(in_srgb,var(--accent)_8%,#eadfd4)] pb-3 text-sm last:border-0 last:pb-0">
                <span className="min-w-0 truncate">{row.product_name}</span>
                <span className="shrink-0 font-serif tabular-nums text-foreground">
                  {row.units} · {formatGhs(Number(row.revenue))}
                </span>
              </li>
            ))}
          </ul>
        </AdminSection>
      ) : null}
    </div>
  );
}
