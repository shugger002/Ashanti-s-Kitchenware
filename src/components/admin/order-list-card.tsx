import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { formatAccraWhen } from "@/lib/accra-time";
import { customerWhatsAppHref } from "@/lib/order-whatsapp";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import type { OrderListItem } from "@/server/orders/service";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import { orderTone, paymentLabel, paymentTone, StatusPill } from "@/components/admin/ui";

function addressLine(order: OrderListItem) {
  return [order.addressLine1, order.addressLine2, order.city, order.region].filter(Boolean).join(", ");
}

export function OrderListCard({ order }: { order: OrderListItem }) {
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const collection = order.deliveryMethod === "collection";
  const shipping = Number(order.shippingAmount);
  const wa = customerWhatsAppHref({
    phone: order.phone,
    publicRef: order.publicRef,
    fullName: order.fullName,
    items: order.items,
    totalLabel: formatGhs(Number(order.total)),
    deliveryMethod: order.deliveryMethod,
  });
  const address = addressLine(order);

  return (
    <article className="admin-panel space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl leading-tight">{order.publicRef}</p>
          <p className="mt-1 text-sm text-muted">{formatAccraWhen(order.createdAt)}</p>
        </div>
        <p className="font-serif text-2xl tabular-nums">{formatGhs(Number(order.total))}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        <StatusPill value={order.status} tone={orderTone(order.status)} />
        <StatusPill value={order.paymentStatus} tone={paymentTone(order.paymentStatus)} label={paymentLabel(order.paymentStatus)} />
        <StatusPill value={collection ? "Collection" : "Delivery"} tone="neutral" label={collection ? "Collection" : "Delivery"} />
      </div>

      <section>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Customer</h3>
        <p className="mt-1.5 text-base">{order.fullName}</p>
        <p className="mt-0.5 text-sm">{order.phone}</p>
        {order.email ? <p className="text-sm text-muted">{order.email}</p> : null}
        <p className="mt-2 text-sm leading-relaxed">
          {collection ? "Collect at the Accra shop." : address || "No street address on this order."}
        </p>
        {order.deliveryInstructions ? <p className="mt-2 text-sm text-muted">{order.deliveryInstructions}</p> : null}
      </section>

      <section>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Package · {pieces} {pieces === 1 ? "piece" : "pieces"}
        </h3>
        {order.items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No pieces listed.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[color-mix(in_srgb,var(--accent)_10%,#eadfd4)]">
            {order.items.map((item, index) => (
              <li key={`${item.sku}-${index}`} className="flex gap-3 py-3">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-16 w-16 shrink-0 object-cover" />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center border border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] bg-white text-[10px] text-muted">
                    {item.sku.slice(0, 6)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Sheet code {item.sku} · {item.quantity} × {formatGhs(Number(item.unitPrice))}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-sm">{formatGhs(Number(item.lineTotal))}</span>
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-2 space-y-1 border-t border-[color-mix(in_srgb,var(--accent)_10%,#eadfd4)] pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Goods</dt>
            <dd className="tabular-nums">{formatGhs(Number(order.subtotal))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Delivery</dt>
            <dd className={shipping > 0 ? "tabular-nums" : "text-muted"}>
              {shipping > 0 ? formatGhs(shipping) : collection ? "Collection" : "Quoted on WhatsApp"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatGhs(Number(order.total))}</dd>
          </div>
        </dl>
      </section>

      <p className="text-sm text-muted">Now: {ORDER_STATUS_LABEL[order.status] ?? order.status}</p>

      <div className="flex flex-wrap items-center gap-3">
        {wa ? <OrderWhatsAppLink href={wa} /> : <p className="text-xs text-muted">No WhatsApp number on this order.</p>}
        <Link href={`/admin/orders/${order.id}`} className="inline-flex min-h-11 items-center text-sm font-medium text-accent">
          Open this order
        </Link>
      </div>
    </article>
  );
}
