import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listOrders } from "@/server/orders/service";
import { formatGhs } from "@/lib/money";
import {
  adminButton,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  orderTone,
  paymentLabel,
  paymentTone,
  StatusPill,
  Toolbar,
} from "@/components/admin/ui";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string }>;
}) {
  await requirePermission("orders.read");
  const params = await searchParams;
  const orders = await listOrders({
    q: params.q,
    status: params.status,
    paymentStatus: params.payment,
  });
  const filtered = Boolean(params.q || params.status || params.payment);
  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Same steps the customer tracker uses: Order Received, Packaging order, Order Out for Delivery, Order Delivered. Quote delivery on WhatsApp — checkout does not add a fee."
      />
      <Toolbar>
        <form className="flex flex-wrap items-center gap-2" method="get">
          <label htmlFor="order-q" className="sr-only">
            Search orders
          </label>
          <input id="order-q" name="q" defaultValue={params.q} placeholder="Reference, name, or phone" className="input max-w-xs" />
          <select name="status" defaultValue={params.status ?? ""} className="input max-w-48" aria-label="Fulfillment">
            <option value="">All fulfillment</option>
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
          <select name="payment" defaultValue={params.payment ?? ""} className="input max-w-48" aria-label="Payment">
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
            title={filtered ? "No matching tickets" : "No orders yet"}
            body={
              filtered
                ? "Clear a filter or search another reference."
                : "When a customer completes checkout, the order lands here with a packing reference."
            }
          />
        </div>
      ) : (
        <AdminTable className="mt-4">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">How</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Fulfillment</th>
              <th className="px-4 py-3 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium">
                    {order.publicRef}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(order.createdAt).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">{order.fullName}</td>
                <td className="px-4 py-3 text-muted">
                  {order.deliveryMethod === "collection" ? "Collection" : "Delivery"}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(order.total))}</td>
                <td className="px-4 py-3">
                  <StatusPill value={order.status} tone={orderTone(order.status)} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill
                    value={order.paymentStatus}
                    tone={paymentTone(order.paymentStatus)}
                    label={paymentLabel(order.paymentStatus)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
