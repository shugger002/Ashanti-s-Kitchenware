import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { hasPermission } from "@/server/auth/types";
import { addOrderNote, getOrderById, ORDER_TRANSITIONS, transitionOrder } from "@/server/orders/service";
import { recordManualPayment } from "@/server/checkout/service";
import { formatGhs } from "@/lib/money";
import { ghanaInternationalMsisdn } from "@/lib/phone-gh";
import { customerWhatsAppHref } from "@/lib/order-whatsapp";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import { CUSTOMER_TRACK_STEPS, customerTrackIndex, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { revalidatePath } from "next/cache";
import {
  adminButton,
  AdminPageHeader,
  BackLink,
  orderTone,
  paymentLabel,
  paymentTone,
  StatusPill,
} from "@/components/admin/ui";

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function money(value: unknown) {
  return formatGhs(Number(value ?? 0));
}

const STAFF_NEXT: Record<string, string> = {
  paid: "Start packing",
  packing: "Mark as packing",
  shipped: "Send out for delivery",
  ready_for_collection: "Ready at the shop",
  delivered: "Mark as delivered",
  collected: "Customer collected it",
  cancelled: "Cancel this order",
  refunded: "Mark as refunded",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("orders.read");
  const canWrite = hasPermission(user.roles, "orders.write");
  const canCapture = hasPermission(user.roles, "payments.capture");
  const { id } = await params;
  const data = await getOrderById(id);
  if (!data) notFound();
  const order = data.order;
  const status = text(order.status);
  const paymentStatus = text(order.payment_status);
  const method = text(order.delivery_method);
  const allowed = (ORDER_TRANSITIONS[status] ?? []).filter((value) => {
    if (method === "collection" && (value === "shipped" || value === "delivered")) return false;
    if (method === "delivery" && (value === "ready_for_collection" || value === "collected")) return false;
    return true;
  });
  const address = [order.address_line1, order.address_line2, order.city, order.region, order.country]
    .map(text)
    .filter(Boolean)
    .join(", ");
  const shippingAmount = Number(order.shipping_amount ?? 0);
  const customerStep = customerTrackIndex(status);
  const waDigits = ghanaInternationalMsisdn(text(order.phone));
  const waHref = customerWhatsAppHref({
    phone: text(order.phone),
    publicRef: text(order.public_ref),
    fullName: text(order.full_name),
    items: data.items.map((item) => ({ name: item.product_name, quantity: item.quantity, sku: item.sku })),
    totalLabel: money(order.total),
    deliveryMethod: method,
  });

  async function changeStatus(formData: FormData) {
    "use server";
    const actor = await requirePermission("orders.write");
    await transitionOrder({
      orderId: String(formData.get("orderId")),
      toStatus: String(formData.get("toStatus")),
      actorUserId: actor.id,
      note: String(formData.get("note") ?? ""),
      trackingNumber: String(formData.get("trackingNumber") || "") || undefined,
    });
    revalidatePath(`/admin/orders/${String(formData.get("orderId"))}`);
  }

  async function capture(formData: FormData) {
    "use server";
    const actor = await requirePermission("payments.capture");
    await recordManualPayment({
      orderId: String(formData.get("orderId")),
      providerRef: String(formData.get("providerRef")),
      actorUserId: actor.id,
      note: String(formData.get("note") ?? "Manual capture"),
    });
    revalidatePath(`/admin/orders/${String(formData.get("orderId"))}`);
  }

  async function note(formData: FormData) {
    "use server";
    const actor = await requirePermission("orders.write");
    await addOrderNote(String(formData.get("orderId")), actor.id, String(formData.get("note")));
    revalidatePath(`/admin/orders/${String(formData.get("orderId"))}`);
  }

  return (
    <div className="space-y-6">
      <BackLink href="/admin/orders">All orders</BackLink>
      <AdminPageHeader
        title={text(order.public_ref)}
        description={`${text(order.full_name)} · ${text(order.phone)}`}
        action={
          <span className="flex flex-wrap gap-2">
            <StatusPill value={status} tone={orderTone(status)} />
            <StatusPill value={paymentStatus} tone={paymentTone(paymentStatus)} label={paymentLabel(paymentStatus)} />
          </span>
        }
      />
      <p className="font-serif text-3xl tabular-nums">{money(order.total)}</p>

      {customerStep < 0 ? (
        <p className="text-sm text-muted">{ORDER_STATUS_LABEL[status] ?? status}</p>
      ) : (
        <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
          {CUSTOMER_TRACK_STEPS.map((label, index) => (
            <li
              key={label}
              className={`text-sm ${index === customerStep ? "font-medium text-accent" : index < customerStep ? "text-foreground" : "text-muted"}`}
            >
              <span className="sm:hidden">{index === customerStep ? "Now · " : index < customerStep ? "Done · " : ""}</span>
              {label}
              {index < CUSTOMER_TRACK_STEPS.length - 1 ? (
                <span className="ml-3 hidden text-muted sm:inline" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <section className="admin-panel">
            <h2 className="font-serif text-xl">What to pack</h2>
            <ul className="mt-4 divide-y divide-border text-sm">
              {data.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-3">
                  <span>
                    {item.product_name}
                    <span className="block text-xs text-muted">
                      {item.sku} · × {item.quantity}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatGhs(Number(item.line_total ?? item.unit_price))}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className={shippingAmount > 0 ? "tabular-nums" : "text-muted"}>
                  {shippingAmount > 0
                    ? money(order.shipping_amount)
                    : method === "collection"
                      ? "Collection"
                      : "Quoted on WhatsApp"}
                </dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-panel text-sm">
            <h2 className="font-serif text-xl">Customer</h2>
            <p className="mt-3">{text(order.full_name)}</p>
            {waDigits.length >= 11 ? (
              <a href={`tel:+${waDigits}`} className="mt-1 block min-h-11 text-accent">
                {text(order.phone)}
              </a>
            ) : (
              <p className="mt-1 text-muted">{text(order.phone)}</p>
            )}
            {text(order.email) ? (
              <a href={`mailto:${text(order.email)}`} className="block min-h-11 text-muted">
                {text(order.email)}
              </a>
            ) : null}
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">
              {text(order.delivery_method) === "collection" ? "Collection" : "Delivery"}
            </p>
            {address ? <p className="mt-1 leading-relaxed">{address}</p> : <p className="mt-1 text-muted">No street address on this order.</p>}
            {text(order.delivery_instructions) ? (
              <p className="mt-3 text-muted">{text(order.delivery_instructions)}</p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2">
              {waDigits.length >= 11 ? (
                <a href={`tel:+${waDigits}`} className={adminButton()}>
                  Call customer
                </a>
              ) : null}
              {waHref ? (
                <OrderWhatsAppLink href={waHref} />
              ) : (
                <p className="text-xs text-muted">No WhatsApp number on this order.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          {canWrite ? (
            allowed.length > 0 ? (
              <form action={changeStatus} className="admin-panel space-y-3">
                <h2 className="font-serif text-xl">Next step</h2>
                <input type="hidden" name="orderId" value={id} />
                <label className="block text-sm">
                  What happens now
                  <select name="toStatus" className="input mt-1">
                    {allowed.map((value) => (
                      <option key={value} value={value}>
                        {STAFF_NEXT[value] ?? ORDER_STATUS_LABEL[value] ?? value.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Rider note (staff only)
                  <input name="trackingNumber" className="input mt-1" placeholder="Customers do not see this" />
                </label>
                <button className={adminButton()} type="submit">
                  Save
                </button>
              </form>
            ) : (
              <div className="admin-panel">
                <h2 className="font-serif text-xl">This order</h2>
                <p className="mt-2 text-sm text-muted">Nothing left to move. It is finished, cancelled, or refunded.</p>
              </div>
            )
          ) : null}

          {canCapture && paymentStatus !== "paid" ? (
            <form action={capture} className="space-y-3 admin-panel">
              <h2 className="font-serif text-xl">Mark as paid</h2>
              <p className="text-xs leading-relaxed text-muted">
                Use this only if you can see the real payment on Hubtel, Moolre, or the bank. Type the payment number from there.
              </p>
              <input type="hidden" name="orderId" value={id} />
              <label className="block text-sm">
                Payment number
                <input name="providerRef" required className="input mt-1" />
              </label>
              <label className="block text-sm">
                Note
                <input name="note" className="input mt-1" />
              </label>
              <button className={adminButton()} type="submit">
                Mark paid
              </button>
            </form>
          ) : paymentStatus === "paid" ? (
            <div className="admin-panel text-sm">
              <h2 className="font-serif text-xl">Payment</h2>
              <p className="mt-2 text-muted">Marked paid.</p>
              {data.payments.length > 0 ? (
                <ul className="mt-3 divide-y divide-border">
                  {data.payments.map((payment) => {
                    const row = payment as Record<string, unknown>;
                    return (
                      <li key={text(row.id)} className="flex justify-between gap-3 py-2">
                        <span>
                          {text(row.provider)}
                          {text(row.provider_ref) ? ` · ${text(row.provider_ref)}` : ""}
                          <span className="block text-xs text-muted">{text(row.status)}</span>
                        </span>
                        <span className="tabular-nums">{money(row.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}

          {data.shipments.length > 0 ? (
            <section className="admin-panel text-sm">
              <h2 className="font-serif text-xl">Delivery notes</h2>
              <ul className="mt-3 space-y-2">
                {data.shipments.map((shipment) => {
                  const row = shipment as Record<string, unknown>;
                  return (
                    <li key={text(row.id)}>
                      {text(row.carrier) || "Rider not named"}
                      {text(row.tracking_number) ? ` · ${text(row.tracking_number)}` : ""}
                      <span className="block text-xs text-muted">{text(row.status)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <form action={note} className="admin-panel space-y-3">
            <h2 className="font-serif text-xl">Staff notes</h2>
            {canWrite ? (
              <>
                <input type="hidden" name="orderId" value={id} />
                <label className="block text-sm">
                  Note
                  <textarea name="note" required placeholder={`From ${user.email}`} className="input mt-1" rows={3} />
                </label>
                <button className={adminButton()} type="submit">
                  Add note
                </button>
              </>
            ) : null}
            {data.history.length > 0 ? (
              <ol className="mt-2 divide-y divide-border text-sm">
                {data.history.map((entry) => {
                  const row = entry as Record<string, unknown>;
                  const from = text(row.from_status);
                  const to = text(row.to_status);
                  const same = from === to;
                  return (
                    <li key={text(row.id)} className="py-3">
                      <p className="text-xs text-muted">
                        {row.created_at ? new Date(String(row.created_at)).toLocaleString("en-GH") : ""}
                      </p>
                      <p className="mt-1">
                        {same
                          ? "Note"
                          : `${ORDER_STATUS_LABEL[from] ?? (from.replaceAll("_", " ") || "-")} → ${ORDER_STATUS_LABEL[to] ?? to.replaceAll("_", " ")}`}
                      </p>
                      {text(row.note) ? <p className="mt-1 text-muted">{text(row.note)}</p> : null}
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
