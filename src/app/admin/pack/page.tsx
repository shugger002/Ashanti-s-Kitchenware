import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { hasPermission } from "@/server/auth/types";
import { listOrders } from "@/server/orders/service";
import { OrderListCard } from "@/components/admin/order-list-card";
import { PrintTicketButton } from "@/components/admin/print-ticket";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

export default async function PackDeskPage() {
  const user = await requirePermission("orders.read");
  const canWrite = hasPermission(user.roles, "orders.write");
  const [toPack, packing] = await Promise.all([
    listOrders({ status: "paid", paymentStatus: "paid" }),
    listOrders({ status: "packing", paymentStatus: "paid" }),
  ]);
  const orders = [...toPack, ...packing];

  return (
    <div className="pack-desk">
      <AdminPageHeader
        title="Pack desk"
        description="Paid tickets to pick, print, pack, then WhatsApp the shopper. Delivery charge is still quoted on WhatsApp, not on this ticket."
        action={
          <>
            <PrintTicketButton />
            <Link href="/admin/orders?status=paid" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
              All paid orders
            </Link>
          </>
        }
      />
      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nothing to pack" body="Paid orders appear here. After you start packing they stay on this desk until they go out or sit ready at the shop." />
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {orders.map((order) => (
            <li key={order.id} className="pack-ticket">
              <OrderListCard order={order} canWrite={canWrite} />
              <p className="mt-2 text-right text-sm">
                <Link href={`/admin/orders/${order.id}`} className="text-accent">
                  Open ticket
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}
      {orders.length > 0 ? (
        <p className="mt-6 text-sm text-muted">
          Use Start packing on a card, print this desk, then send it out or mark it ready at the shop.
        </p>
      ) : null}
    </div>
  );
}
