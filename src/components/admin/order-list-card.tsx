import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { formatAccraWhen } from "@/lib/accra-time";
import { customerWhatsAppHref } from "@/lib/order-whatsapp";
import { ORDER_STATUS_LABEL, forwardOrderSteps, staffNextLabel } from "@/lib/order-status";
import { ORDER_TRANSITIONS, type OrderListItem } from "@/server/orders/service";
import { transitionOrderAction } from "@/app/admin/orders/actions";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import { adminButton, orderTone, paymentLabel, paymentTone, StatusPill } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

function addressLine(order: OrderListItem) {
  return [order.addressLine1, order.addressLine2, order.city, order.region].filter(Boolean).join(", ");
}

export function OrderListCard({ order, canWrite }: { order: OrderListItem; canWrite?: boolean }) {
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const collection = order.deliveryMethod === "collection";
  const shipping = Number(order.shippingAmount);
  const address = addressLine(order);
  const nextStep = forwardOrderSteps(order.status, order.deliveryMethod, ORDER_TRANSITIONS)[0];
  const wa = customerWhatsAppHref({
    phone: order.phone,
    publicRef: order.publicRef,
    fullName: order.fullName,
    items: order.items,
    totalLabel: formatGhs(Number(order.total)),
    deliveryMethod: order.deliveryMethod,
    address,
    deliveryNote: order.deliveryInstructions ?? undefined,
  });

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

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href={`/admin/orders/${order.id}`} className={adminButton()}>
          Open this order
        </Link>
        {canWrite && nextStep ? (
          <form action={transitionOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="toStatus" value={nextStep} />
            <button type="submit" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
              {staffNextLabel(nextStep)}
            </button>
          </form>
        ) : null}
        {wa ? <OrderWhatsAppLink href={wa} /> : <p className="text-xs text-muted">No WhatsApp number on this order.</p>}
      </div>
    </article>
  );
}
