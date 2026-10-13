import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { dashboardMetrics } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { brand } from "@/config/brand";
import { paymentsAreReady } from "@/server/payments";
import {
  adminButton,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  orderTone,
  paymentLabel,
  paymentTone,
  StatusPill,
} from "@/components/admin/ui";

export default async function AdminHomePage() {
  await requirePermission("orders.read");
  const metrics = await dashboardMetrics();
  const pending = Number(metrics.pending_orders);
  const packing = Number(metrics.packing_orders);
  const ready = Number(metrics.ready_to_pack);
  const out = Number(metrics.out_for_delivery);
  const low = Number(metrics.lowStock);
  const soldOut = Number(metrics.outOfStock);
  const demo = Number(metrics.demoListings);
  const promo = Number(metrics.promoListings);
  const today = new Date().toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{today}</p>
      <AdminPageHeader
        title={`${brand.name} desk`}
        description="Pack the floor against the same four steps customers see: Received → Packaging → Out for Delivery → Delivered. Delivery charges stay on WhatsApp."
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

      <dl className="mt-3 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-background sm:grid-cols-3">
        {[
          ["Paid orders", metrics.paid_orders],
          ["Paid revenue", formatGhs(Number(metrics.revenue))],
          ["Average paid order", formatGhs(Number(metrics.aov))],
        ].map(([label, value], index) => (
          <div key={label} className={`px-5 py-4 ${index > 0 ? "border-t border-border sm:border-t-0 sm:border-l" : ""}`}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 font-serif text-xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        <li className="rounded-2xl border border-border bg-background p-4 text-sm">
          <p className="text-xs text-muted">Online payment keys</p>
          <p className="mt-1 font-medium">{paymentsAreReady() ? "Hubtel or Moolre is configured" : "Not configured — staff can still record a verified payment"}</p>
        </li>
        <li>
          <Link href="/admin/promotions" className="block rounded-2xl border border-border bg-background p-4 text-sm">
            <p className="text-xs text-muted">Promo listings</p>
            <p className="mt-1 font-medium">{promo} on the storefront popup</p>
          </Link>
        </li>
        <li>
          <Link href="/admin/products?q=DEMO" className="block rounded-2xl border border-border bg-background p-4 text-sm">
            <p className="text-xs text-muted">Demo SKUs</p>
            <p className={`mt-1 font-medium ${demo > 0 ? "text-accent" : ""}`}>
              {demo > 0 ? `${demo} still labelled DEMO — unpublish before launch` : "None"}
            </p>
          </Link>
        </li>
      </ul>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl">Recent orders</h2>
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
          <AdminTable>
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">How</th>
                <th className="px-4 py-3 font-medium">Fulfillment</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recent.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium">
                      {order.public_ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.full_name}</td>
                  <td className="px-4 py-3 tabular-nums">{formatGhs(Number(order.total))}</td>
                  <td className="px-4 py-3 text-muted">
                    {order.delivery_method === "collection" ? "Collection" : "Delivery · WhatsApp"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={order.status} tone={orderTone(order.status)} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      value={order.payment_status}
                      tone={paymentTone(order.payment_status)}
                      label={paymentLabel(order.payment_status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </section>

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
