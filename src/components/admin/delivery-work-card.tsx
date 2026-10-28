import Link from "next/link";
import { formatAccraWhen } from "@/lib/accra-time";
import { orderStatusLabel } from "@/lib/order-status";
import type { OrderListItem } from "@/server/orders/service";
import { adminButton, orderTone, StatusPill } from "@/components/admin/ui";

export function DeliveryWorkCard({ order }: { order: OrderListItem }) {
  const collection = order.deliveryMethod === "collection";
  return (
    <article className="admin-panel space-y-4">
      <header>
        <p className="font-serif text-2xl leading-tight">{order.publicRef}</p>
        <p className="mt-1 text-sm text-muted">{formatAccraWhen(order.createdAt)}</p>
      </header>
      <div className="flex flex-wrap gap-1">
        <StatusPill value={order.status} tone={orderTone(order.status)} label={orderStatusLabel(order.status)} />
        <StatusPill value={collection ? "Collection" : "Delivery"} tone="neutral" label={collection ? "Collection" : "Delivery"} />
      </div>
      <p className="text-base">{order.fullName}</p>
      <p className="text-sm">{order.phone}</p>
      <p className="text-sm text-muted">{collection ? "Collect at the Accra shop." : "Quote delivery on WhatsApp."}</p>
      <Link href={`/admin/orders/${order.id}`} className={adminButton()}>
        Open this order
      </Link>
    </article>
  );
}
