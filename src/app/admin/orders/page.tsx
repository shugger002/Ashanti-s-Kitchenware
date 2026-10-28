import { requirePermission } from "@/server/auth/authorize";
import { hasPermission } from "@/server/auth/types";
import { countOrderGlance, listOrders, ORDER_TRANSITIONS, type OrderNeedFilter } from "@/server/orders/service";
import { OrderListCard } from "@/components/admin/order-list-card";
import { adminButton, AdminGlance, AdminPageHeader, EmptyState, Toolbar } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

function parseNeed(value?: string): OrderNeedFilter | "" {
  return value === "work" || value === "out" || value === "done" ? value : "";
}

function listHref(opts: { q?: string; status?: string; payment?: string; need?: string }) {
  const params = new URLSearchParams();
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.status) params.set("status", opts.status);
  if (opts.payment) params.set("payment", opts.payment);
  if (opts.need) params.set("need", opts.need);
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string; need?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  const allStages = params.status === "all";
  const status = !allStages && params.status && params.status in ORDER_TRANSITIONS ? params.status : "";
  const payment = params.payment;
  const searching = Boolean(q?.trim());
  const needParam = parseNeed(params.need);
  const need: OrderNeedFilter | undefined =
    allStages || status || payment || searching ? undefined : needParam || "work";
  const [user, orders, glance] = await Promise.all([
    requirePermission("orders.read"),
    listOrders({
      q,
      status: status || undefined,
      paymentStatus: payment,
      need,
    }),
    countOrderGlance(),
  ]);
  const canWrite = hasPermission(user.roles, "orders.write");
  const filtered = Boolean(searching || status || payment || needParam);
  const workNowActive = need === "work" && !status && !payment;
  const chips: { href: string; label: string; active: boolean }[] = [
    { href: listHref({ q, need: "work" }), label: "Work now", active: workNowActive },
    { href: listHref({ q, status: "pending_payment" }), label: "Waiting on payment", active: status === "pending_payment" },
    { href: listHref({ q, status: "paid" }), label: "Ready to pack", active: status === "paid" },
    { href: listHref({ q, status: "packing" }), label: "Packing", active: status === "packing" },
    { href: listHref({ q, need: "out" }), label: "Out", active: need === "out" || status === "shipped" },
    { href: listHref({ q, need: "done" }), label: "Done", active: need === "done" || status === "delivered" || status === "collected" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Work now is unpaid, paid, packing, or out. Open a ticket to pack, call, or WhatsApp. Delivery is quoted on WhatsApp, not at checkout."
      />
      <AdminGlance
        items={[
          { href: "/admin/orders", label: "Work now", value: glance.work, warn: glance.work > 0 },
          { href: "/admin/orders?status=pending_payment", label: "Waiting on payment", value: glance.waitingPay, warn: glance.waitingPay > 0 },
          { href: "/admin/orders?status=paid", label: "Ready to pack", value: glance.toPack, warn: glance.toPack > 0 },
          { href: "/admin/orders?status=packing", label: "Packing", value: glance.packing, warn: glance.packing > 0 },
          { href: "/admin/orders?need=out", label: "Out", value: glance.out, warn: glance.out > 0 },
        ]}
      />
      <Toolbar>
        <form className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" method="get">
          {needParam && !status ? <input type="hidden" name="need" value={needParam} /> : null}
          <label htmlFor="order-q" className="sr-only">
            Search orders
          </label>
          <input id="order-q" name="q" defaultValue={params.q} placeholder="Order no., name, or phone" className="input w-full sm:max-w-xs" />
          <select name="status" defaultValue={allStages ? "all" : status} className="input w-full sm:max-w-48" aria-label="Order stage">
            <option value="">Use chips above</option>
            <option value="all">All stages</option>
            <option value="pending_payment">Order Received (unpaid)</option>
            <option value="paid">Order Received (paid)</option>
            <option value="packing">Packaging order</option>
            <option value="shipped">Order Out for Delivery</option>
            <option value="ready_for_collection">Ready at the shop</option>
            <option value="delivered">Order Delivered</option>
            <option value="collected">Collected</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select name="payment" defaultValue={params.payment ?? ""} className="input w-full sm:max-w-48" aria-label="Payment">
            <option value="">All payments</option>
            <option value="pending">Pending</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          <button className={adminButton()} type="submit">
            Filter
          </button>
        </form>
      </Toolbar>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              buttonClass("ghost", "h-10 min-h-10 px-3 text-sm"),
              chip.active && "bg-foreground text-background hover:bg-foreground",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={filtered ? "No matching orders" : "No orders yet"}
            body={
              filtered
                ? "Clear a filter or try another name, phone, or order number."
                : "When a customer finishes checkout, the order shows here."
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderListCard order={order} canWrite={canWrite} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
