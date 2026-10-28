import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { formatAccraWhen } from "@/lib/accra-time";
import { customerWhatsAppHref, packLines } from "@/lib/order-whatsapp";
import { orderStatusLabel } from "@/lib/order-status";
import type { PaidDeskOrder } from "@/server/reporting/service";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import { adminButton, orderTone, StatusPill } from "@/components/admin/ui";

export function AnalyticsOrderCard({ order }: { order: PaidDeskOrder }) {
  const wa = customerWhatsAppHref({
    phone: order.phone,
    publicRef: order.publicRef,
    fullName: order.fullName,
    items: order.items,
    totalLabel: formatGhs(Number(order.total)),
    deliveryMethod: order.deliveryMethod,
  });
  return (
    <article className="admin-panel space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl leading-tight">{order.publicRef}</p>
          <p className="mt-1 text-sm text-muted">{formatAccraWhen(order.createdAt)}</p>
        </div>
        <p className="font-serif text-2xl tabular-nums">{formatGhs(Number(order.total))}</p>
      </header>
      <StatusPill value={order.status} tone={orderTone(order.status)} label={orderStatusLabel(order.status)} />
      <p className="text-base">{order.fullName}</p>
      <p className="text-sm">{order.phone}</p>
      <p className="text-sm text-muted">{packLines(order.items)}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href={`/admin/orders/${order.id}`} className={adminButton()}>
          Open this order
        </Link>
        {wa ? <OrderWhatsAppLink href={wa} labeled /> : null}
      </div>
    </article>
  );
}
