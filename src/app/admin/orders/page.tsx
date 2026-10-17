import { requirePermission } from "@/server/auth/authorize";
import { listOrders } from "@/server/orders/service";
import { OrderListCard } from "@/components/admin/order-list-card";
import { adminButton, AdminPageHeader, AdminStat, EmptyState, Toolbar } from "@/components/admin/ui";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string }>;
}) {
  const params = await searchParams;
  const [, orders] = await Promise.all([
    requirePermission("orders.read"),
    listOrders({
      q: params.q,
      status: params.status,
      paymentStatus: params.payment,
    }),
  ]);
  const filtered = Boolean(params.q || params.status || params.payment);
  const waitingPay = orders.filter((order) => order.paymentStatus !== "paid" && order.status !== "cancelled").length;
  const toPack = orders.filter((order) => order.paymentStatus === "paid" && order.status === "paid").length;
  const pieces = orders.reduce((sum, order) => sum + order.items.reduce((n, item) => n + item.quantity, 0), 0);

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Customer, pieces to pack, address, and WhatsApp on every order. Delivery is quoted on WhatsApp, not at checkout."
      />
      {orders.length > 0 ? (
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          <li>
            <AdminStat label="On this list" value={orders.length} hint={filtered ? "Matching the filter" : "Latest 100"} />
          </li>
          <li>
            <AdminStat label="Waiting on payment" value={waitingPay} warn={waitingPay > 0} />
          </li>
          <li>
            <AdminStat label="Ready to pack" value={toPack} hint={`${pieces} pieces on this list`} warn={toPack > 0} />
          </li>
        </ul>
      ) : null}
      <Toolbar>
        <form className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" method="get">
          <label htmlFor="order-q" className="sr-only">
            Search orders
          </label>
          <input id="order-q" name="q" defaultValue={params.q} placeholder="Order no., name, or phone" className="input w-full sm:max-w-xs" />
          <select name="status" defaultValue={params.status ?? ""} className="input w-full sm:max-w-48" aria-label="Order stage">
            <option value="">All stages</option>
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
              <OrderListCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
