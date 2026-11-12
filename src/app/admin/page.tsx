import Link from "next/link";
import { requireUser } from "@/server/auth/authorize";
import { dashboardMetrics, dashboardRange, type DeskRange } from "@/server/reporting/service";
import { dashboardGrowth } from "@/server/reporting/growth";
import { HomeGrowth } from "@/components/admin/home-growth";
import { formatGhs } from "@/lib/money";
import { customerWhatsAppHref, formatOrderAddress, packLines } from "@/lib/order-whatsapp";
import { hasPermission } from "@/server/auth/types";
import { redirect } from "next/navigation";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminSection,
  AdminStat,
  EmptyState,
  liveOrderBadge,
  paymentTone,
  StatusPill,
} from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

function count(value: string | undefined) {
  return Number(value ?? 0);
}

function accraDateLabel() {
  return new Intl.DateTimeFormat("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Accra",
  }).format(new Date());
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: DeskRange = params.range === "7d" || params.range === "30d" ? params.range : "today";
  let metricsError = "";
  let metrics: Awaited<ReturnType<typeof dashboardMetrics>> | null = null;
  let growth: Awaited<ReturnType<typeof dashboardGrowth>> | null = null;
  let rangeStats: Awaited<ReturnType<typeof dashboardRange>> | null = null;
  const user = await requireUser();
  if (!hasPermission(user.roles, "orders.read")) {
    redirect(hasPermission(user.roles, "ops.write") ? "/admin/ops" : "/admin/login");
  }
  try {
    [metrics, growth, rangeStats] = await Promise.all([dashboardMetrics(), dashboardGrowth(), dashboardRange(range)]);
  } catch {
    metricsError = "Live desk numbers could not load. Check Connections.";
  }
  const firstName = (user?.fullName ?? "").trim().split(/\s+/)[0] || "";
  const greeting = /^(store|admin|staff|owner)$/i.test(firstName) ? "Accra desk" : `${firstName || "Staff"}, Accra desk`;
  if (!metrics || !growth || !rangeStats) {
    return (
      <div>
        <AdminPageHeader title="Accra desk" description={metricsError || "The desk is still opening."} />
        <p className="mt-6 text-sm text-accent">{metricsError || "Try again in a moment."}</p>
        <Link href="/admin/ops" className="mt-4 inline-flex min-h-11 text-sm text-accent">
          Operations
        </Link>
      </div>
    );
  }
  const canProducts = hasPermission(user.roles, "products.read");
  const canAddProduct = hasPermission(user.roles, "products.write");
  const canInventory = hasPermission(user.roles, "inventory.write");
  const canReports = hasPermission(user.roles, "reports.read");
  const canCustomers = hasPermission(user.roles, "customers.read");

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
      href: "/admin/orders?need=out",
      label: "Out",
      value: count(metrics.out_for_delivery),
      hint: "Sent out or ready at the shop",
    },
  ];

  const glance = [
    { href: "/admin/orders", label: "Orders today", value: String(count(metrics.today_orders)), warn: false },
    {
      href: canReports ? "/admin/analytics?need=today" : "/admin/orders",
      label: "Paid today",
      value: formatGhs(Number(metrics.today_revenue)),
      warn: false,
    },
    { href: "/admin/orders?need=done", label: "Delivered today", value: String(count(metrics.fulfilled_today)), warn: false },
    {
      href: canCustomers ? "/admin/customers?need=new" : "/admin",
      label: "New customers",
      value: String(count(metrics.new_customers_today)),
      warn: false,
    },
    canInventory
      ? { href: "/admin/inventory?need=low", label: "Low stock", value: String(count(metrics.lowStock)), warn: count(metrics.lowStock) > 0 }
      : null,
    canInventory
      ? { href: "/admin/inventory?need=out", label: "Out of stock", value: String(count(metrics.outOfStock)), warn: count(metrics.outOfStock) > 0 }
      : null,
    canProducts
      ? { href: "/admin/products", label: "Sample products", value: String(count(metrics.demoListings)), warn: count(metrics.demoListings) > 0 }
      : null,
    canProducts
      ? { href: "/admin/promotions", label: "On promo", value: String(count(metrics.promoListings)), warn: false }
      : null,
  ].filter(Boolean) as { href: string; label: string; value: string; warn: boolean }[];

  return (
    <div>
      <AdminPageHeader
        title={greeting}
        description={`${accraDateLabel()}. Paid takings, what is moving, and the orders still waiting on this desk.`}
        action={
          <>
            {canAddProduct ? (
              <Link href="/admin/products/new" className={adminButton()}>
                Add product
              </Link>
            ) : null}
            <Link href="/admin/pack" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
              Pack desk
            </Link>
            <Link href="/admin/orders" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
              All orders
            </Link>
          </>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["today", "Today"],
            ["7d", "7 days"],
            ["30d", "30 days"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            href={id === "today" ? "/admin" : `/admin?range=${id}`}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
              range === id ? "bg-accent text-white" : "bg-white text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <AdminGlance
        className="mt-3"
        items={[
          { href: "/admin/orders", label: range === "today" ? "Orders today" : `Orders · ${range}`, value: String(rangeStats.orders) },
          {
            href: canReports ? "/admin/analytics" : "/admin/orders",
            label: range === "today" ? "Paid today" : `Paid · ${range}`,
            value: formatGhs(rangeStats.revenue),
          },
          {
            href: "/admin/orders?status=pending_payment",
            label: "Unpaid in range",
            value: String(rangeStats.pending),
            warn: rangeStats.pending > 0,
          },
        ]}
      />

      <HomeGrowth growth={growth} canReports={canReports} />

      <section className="mt-8">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Work now</h2>
        <ul className="admin-panel admin-panel-flush mt-3 divide-y divide-border overflow-hidden sm:hidden">
          {queue.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="flex min-h-14 items-center justify-between gap-4 px-5 py-3">
                <span>
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{item.hint}</span>
                </span>
                <span className={`font-serif text-2xl tabular-nums ${item.value > 0 ? "text-accent" : "text-foreground"}`}>
                  {item.value}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-3 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {queue.map((item) => (
            <li key={item.label}>
              <AdminStat
                href={item.href}
                label={item.label}
                value={item.value}
                hint={item.hint}
                warn={item.value > 0}
                size="lg"
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Today and stock</h2>
        <AdminGlance className="mt-3" items={glance} />
      </section>

      <AdminSection
        className="mt-8"
        title="Recent orders"
        action={
          <Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm text-accent">
            All orders
          </Link>
        }
      >
        {metrics.recent.length === 0 ? (
          <EmptyState title="No orders yet" body="When a customer finishes checkout, the order shows here." />
        ) : (
          <ul className="-mx-1 divide-y divide-border">
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
                <li key={order.id} className="space-y-3 py-5 first:pt-1">
                  <Link href={`/admin/orders/${order.id}`} className="flex min-h-11 items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium">{order.full_name}</span>
                      <span className="mt-0.5 block text-xs text-muted">{order.public_ref}</span>
                      <span className="mt-2 block text-sm leading-relaxed text-neutral-800">{packLines(items)}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <StatusPill
                        value={liveOrderBadge(order.payment_status, order.status)}
                        tone={order.payment_status === "paid" ? "ok" : paymentTone(order.payment_status)}
                      />
                      <span className="mt-2 block font-serif text-lg tabular-nums">{formatGhs(Number(order.total))}</span>
                    </span>
                  </Link>
                  {wa ? <OrderWhatsAppLink href={wa} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </AdminSection>

    </div>
  );
}
