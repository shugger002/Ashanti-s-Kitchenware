import { formatGhs } from "@/lib/money";
import { CUSTOMER_TRACK_STEPS, customerTrackIndex } from "@/lib/order-status";

type TrackOrder = {
  id: string;
  public_ref: string;
  status: string;
  payment_status: string;
  total: string;
  delivery_method: string;
};

type TrackItem = { id: string; product_name: string; quantity: number };

function headline(status: string) {
  if (status === "cancelled") return "This order was cancelled.";
  if (status === "refunded") return "This order was refunded.";
  const index = customerTrackIndex(status);
  if (index <= 0) return CUSTOMER_TRACK_STEPS[0];
  if (index === 1) return CUSTOMER_TRACK_STEPS[1];
  if (index === 2) return CUSTOMER_TRACK_STEPS[2];
  return CUSTOMER_TRACK_STEPS[3];
}

export function OrderTracker({
  order,
  items,
  whatsappHref,
}: {
  order: TrackOrder;
  items: TrackItem[];
  whatsappHref: string | null;
}) {
  const collection = order.delivery_method === "collection";
  const labels = CUSTOMER_TRACK_STEPS;
  const current = customerTrackIndex(order.status);
  const stopped = current < 0;

  return (
    <article className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow)] sm:p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{order.public_ref}</p>
      <h2 className="mt-2 font-serif text-2xl tracking-tight">{headline(order.status)}</h2>
      <p className="mt-1 text-sm text-muted">
        {collection ? "Collection at the Accra shop." : "Delivery timing is confirmed on WhatsApp, not a live map."}
      </p>

      {stopped ? null : (
        <ol className="mt-6 space-y-0">
          {labels.map((label, index) => {
            const done = index < current;
            const here = index === current;
            return (
              <li key={label} className="flex gap-3">
                <span className="flex w-5 flex-col items-center">
                  <span
                    className={
                      here
                        ? "mt-0.5 size-3.5 rounded-full bg-accent"
                        : done
                          ? "mt-0.5 size-3.5 rounded-full bg-accent/70"
                          : "mt-0.5 size-3.5 rounded-full border-2 border-border bg-surface"
                    }
                  />
                  {index < labels.length - 1 ? (
                    <span className={`w-px flex-1 min-h-6 ${done || here ? "bg-accent/40" : "bg-border"}`} />
                  ) : null}
                </span>
                <p className={`pb-5 text-[15px] ${here ? "font-medium text-foreground" : done ? "text-foreground" : "text-muted"}`}>
                  {label}
                  {here ? <span className="mt-0.5 block text-xs font-normal text-accent">Now</span> : null}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      <ul className="border-t border-border pt-4 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 py-1">
            <span>{item.product_name}</span>
            <span className="text-muted">× {item.quantity}</span>
          </li>
        ))}
        <li className="mt-2 flex justify-between font-medium">
          <span>Total</span>
          <span className="price">{formatGhs(Number(order.total))}</span>
        </li>
      </ul>

      {whatsappHref ? (
        <a href={whatsappHref} className="mt-5 inline-block text-sm text-accent">
          Chat on WhatsApp
        </a>
      ) : null}
    </article>
  );
}
