import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listOrders } from "@/server/orders/service";
import { formatGhs } from "@/lib/money";
import {
  adminButton,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  MobileCards,
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
  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="When a customer pays, pack it, quote delivery on WhatsApp, then mark it sent. Checkout does not add a delivery fee."
      />
      <Toolbar>
        <form className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" method="get">
          <label htmlFor="order-q" className="sr-only">
            Search orders
          </label>
          <input id="order-q" name="q" defaultValue={params.q} placeholder="Reference, name, or phone" className="input w-full sm:max-w-xs" />
          <select name="status" defaultValue={params.status ?? ""} className="input w-full sm:max-w-48" aria-label="Fulfillment">
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
            title={filtered ? "No matching tickets" : "No orders yet"}
            body={
              filtered
                ? "Clear a filter or search another reference."
                : "When a customer completes checkout, the order lands here with a packing reference."
            }
          />
        </div>
      ) : (
        <>
        <MobileCards>
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="block min-h-11 rounded-xl border border-border bg-white/95 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{order.publicRef}</p>
                  <p className="shrink-0 tabular-nums">{formatGhs(Number(order.total))}</p>
                </div>
                <p className="mt-1 text-sm">{order.fullName}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {new Date(order.createdAt).toLocaleString("en-GH", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}
                  {order.deliveryMethod === "collection" ? "Collection" : "Delivery"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill value={order.status} tone={orderTone(order.status)} />
                  <StatusPill
                    value={order.paymentStatus}
                    tone={paymentTone(order.paymentStatus)}
                    label={paymentLabel(order.paymentStatus)}
                  />
                </div>
              </Link>
            </li>
          ))}
        </MobileCards>
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
        </>
      )}
    </div>
  );
}
