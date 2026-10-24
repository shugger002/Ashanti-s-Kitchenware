import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { hasPermission } from "@/server/auth/types";
import { addOrderNote, getOrderById, ORDER_TRANSITIONS, transitionOrder } from "@/server/orders/service";
import { recordManualPayment } from "@/server/checkout/service";
import { formatGhs } from "@/lib/money";
import { formatAccraWhen } from "@/lib/accra-time";
import { ghanaInternationalMsisdn } from "@/lib/phone-gh";
import { customerWhatsAppHref } from "@/lib/order-whatsapp";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import { CUSTOMER_TRACK_STEPS, customerTrackIndex, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { revalidatePath } from "next/cache";
import { buttonClass } from "@/components/ui/button";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminSection,
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
  paid: "Mark as paid",
  packing: "Start packing",
  shipped: "Send out for delivery",
  ready_for_collection: "Ready at the shop",
  delivered: "Mark as delivered",
  collected: "Customer collected it",
  cancelled: "Cancel this order",
  refunded: "Mark as refunded",
};

function nextStepHint(status: string, method: string) {
  if (status === "paid") {
    return method === "collection"
      ? "Pack first. After that you can mark it ready at the shop, then collected."
      : "Pack first. After that you can send it out, then mark it delivered.";
  }
  if (status === "packing") {
    return method === "collection"
      ? "When the pack is ready on the floor, mark it ready at the shop."
      : "When the rider leaves, send it out for delivery.";
  }
  if (status === "shipped") return "When the customer has the goods, mark it delivered.";
  if (status === "ready_for_collection") return "When they pick it up at the shop, mark it collected.";
  return "Choose the step that has just happened.";
}

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
  const pieceCount = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const forward = allowed.filter((value) => value !== "cancelled" && value !== "refunded");
  const danger = allowed.filter((value) => value === "cancelled" || value === "refunded");
  const primaryStep = forward[0];
  const laterSteps = forward.slice(1);
  const waDigits = ghanaInternationalMsisdn(text(order.phone));
  const waHref = customerWhatsAppHref({
    phone: text(order.phone),
    publicRef: text(order.public_ref),
    fullName: text(order.full_name),
    items: data.items.map((item) => ({ name: item.product_name, quantity: item.quantity, sku: item.sku })),
    totalLabel: money(order.total),
    deliveryMethod: method,
    address,
    deliveryNote: text(order.delivery_instructions) || undefined,
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
        description={`${text(order.full_name)} · ${text(order.phone)} · Placed ${order.created_at ? formatAccraWhen(String(order.created_at)) : ""}`}
        action={
          <span className="flex flex-wrap gap-2">
            <StatusPill value={status} tone={orderTone(status)} />
            <StatusPill value={paymentStatus} tone={paymentTone(paymentStatus)} label={paymentLabel(paymentStatus)} />
          </span>
        }
      />
      <AdminGlance
        className="mt-0"
        items={[
          { label: "Pieces", value: pieceCount },
          { label: "Payment", value: paymentLabel(paymentStatus), warn: paymentStatus !== "paid" },
          { label: "How it goes", value: method === "collection" ? "Collection" : "Delivery" },
          { label: "Total", value: money(order.total) },
        ]}
      />

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
        <div className="space-y-5 lg:col-start-2 lg:row-start-1">
          <AdminSection title="Reach them">
            <p className="text-base">{text(order.full_name)}</p>
            <p className="mt-1 text-sm">{text(order.phone)}</p>
            <div className="mt-4 flex flex-col gap-2">
              {waDigits.length >= 11 ? (
                <a href={`tel:+${waDigits}`} className={adminButton()}>
                  Call customer
                </a>
              ) : null}
              {waHref ? (
                <OrderWhatsAppLink href={waHref} labeled />
              ) : (
                <p className="text-xs text-muted">No WhatsApp number on this order.</p>
              )}
            </div>
          </AdminSection>

          {canWrite ? (
            allowed.length > 0 ? (
              <form action={changeStatus}>
                <AdminSection title="Next step" hint={nextStepHint(status, method)}>
                  <input type="hidden" name="orderId" value={id} />
                  <label className="block text-sm">
                    Rider note (staff only)
                    <input name="trackingNumber" className="input mt-1" placeholder="Customers do not see this" />
                  </label>
                  <div className="mt-4 flex flex-col gap-2">
                    {primaryStep ? (
                      <button className={adminButton()} type="submit" name="toStatus" value={primaryStep}>
                        {STAFF_NEXT[primaryStep] ?? ORDER_STATUS_LABEL[primaryStep] ?? primaryStep.replaceAll("_", " ")}
                      </button>
                    ) : null}
                    {laterSteps.map((value) => (
                      <button
                        key={value}
                        className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}
                        type="submit"
                        name="toStatus"
                        value={value}
                      >
                        {STAFF_NEXT[value] ?? ORDER_STATUS_LABEL[value] ?? value.replaceAll("_", " ")}
                      </button>
                    ))}
                    {danger.map((value) => (
                      <button
                        key={value}
                        className={buttonClass("ghost", "h-12 min-h-12 w-full text-accent sm:w-auto")}
                        type="submit"
                        name="toStatus"
                        value={value}
                      >
                        {STAFF_NEXT[value] ?? ORDER_STATUS_LABEL[value] ?? value.replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </AdminSection>
              </form>
            ) : (
              <AdminSection title="This order">
                <p className="text-sm text-muted">Nothing left to move. It is finished, cancelled, or refunded.</p>
              </AdminSection>
            )
          ) : null}

          {canCapture && paymentStatus !== "paid" ? (
            <form action={capture}>
              <AdminSection
                title="Mark as paid"
                hint="Use this only if you can see the real payment on Hubtel, Moolre, or the bank. Type the payment number from there."
              >
                <input type="hidden" name="orderId" value={id} />
                <label className="block text-sm">
                  Payment number
                  <input name="providerRef" required className="input mt-1" />
                </label>
                <label className="mt-3 block text-sm">
                  Note
                  <input name="note" className="input mt-1" />
                </label>
                <button className={`${adminButton()} mt-4`} type="submit">
                  Mark paid
                </button>
              </AdminSection>
            </form>
          ) : paymentStatus === "paid" ? (
            <AdminSection title="Payment">
              <p className="text-sm text-muted">Marked paid.</p>
              {data.payments.length > 0 ? (
                <ul className="mt-3 divide-y divide-border text-sm">
                  {data.payments.map((payment) => {
                    const row = payment as Record<string, unknown>;
                    return (
                      <li key={text(row.id)} className="flex justify-between gap-3 py-2">
                        <span>
                          {text(row.provider)}
                          {text(row.provider_ref) ? ` · ${text(row.provider_ref)}` : ""}
                          <span className="block text-xs text-muted">{text(row.status)}</span>
                        </span>
                        <span className="font-serif tabular-nums">{money(row.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </AdminSection>
          ) : null}

          {data.shipments.length > 0 ? (
            <AdminSection title="Delivery notes">
              <ul className="space-y-2 text-sm">
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
            </AdminSection>
          ) : null}

          <form action={note}>
            <AdminSection title="Staff notes">
              {canWrite ? (
                <>
                  <input type="hidden" name="orderId" value={id} />
                  <label className="block text-sm">
                    Note
                    <textarea name="note" required placeholder={`From ${user.email}`} className="input mt-1" rows={3} />
                  </label>
                  <button className={`${adminButton()} mt-4`} type="submit">
                    Add note
                  </button>
                </>
              ) : null}
              {data.history.length > 0 ? (
                <ol className="mt-4 divide-y divide-border text-sm">
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
            </AdminSection>
          </form>
        </div>

        <div className="space-y-5 lg:col-start-1 lg:row-start-1">
          <AdminSection title="What to pack" hint={`${pieceCount} ${pieceCount === 1 ? "piece" : "pieces"}`}>
            <ul className="divide-y divide-border text-sm">
              {data.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt="" className="h-16 w-16 shrink-0 object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center border border-border bg-white text-[10px] text-muted">
                      {item.sku.slice(0, 6)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    {item.product_name}
                    <span className="block text-xs text-muted">
                      Sheet code {item.sku} · {item.quantity} × {formatGhs(Number(item.unit_price))}
                    </span>
                  </span>
                  <span className="shrink-0 font-serif tabular-nums">{formatGhs(Number(item.line_total ?? item.unit_price))}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-serif tabular-nums">{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className={shippingAmount > 0 ? "font-serif tabular-nums" : "text-muted"}>
                  {shippingAmount > 0
                    ? money(order.shipping_amount)
                    : method === "collection"
                      ? "Collection"
                      : "Quoted on WhatsApp"}
                </dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Total</dt>
                <dd className="font-serif tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </AdminSection>

          <AdminSection title="Customer">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Name</dt>
                <dd className="mt-0.5">{text(order.full_name)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Phone</dt>
                <dd className="mt-0.5">
                  {waDigits.length >= 11 ? (
                    <a href={`tel:+${waDigits}`} className="text-accent">
                      {text(order.phone)}
                    </a>
                  ) : (
                    text(order.phone)
                  )}
                </dd>
              </div>
              {text(order.email) ? (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Email</dt>
                  <dd className="mt-0.5">
                    <a href={`mailto:${text(order.email)}`} className="text-muted">
                      {text(order.email)}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  {method === "collection" ? "Collection" : "Delivery address"}
                </dt>
                <dd className="mt-0.5 leading-relaxed">
                  {method === "collection" ? "Collect at the Accra shop." : address || "No street address on this order."}
                </dd>
              </div>
              {text(order.delivery_instructions) ? (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Note on the order</dt>
                  <dd className="mt-0.5 text-muted">{text(order.delivery_instructions)}</dd>
                </div>
              ) : null}
            </dl>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
