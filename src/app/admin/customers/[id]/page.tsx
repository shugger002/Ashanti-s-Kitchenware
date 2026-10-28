import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { getCustomerDesk } from "@/server/customers/service";
import { formatGhs } from "@/lib/money";
import { formatAccraWhen } from "@/lib/accra-time";
import { ghanaInternationalMsisdn } from "@/lib/phone-gh";
import { customerGreetingWhatsAppHref, customerWhatsAppHref, formatOrderAddress } from "@/lib/order-whatsapp";
import { ORDER_STATUS_LABEL, orderStatusLabel } from "@/lib/order-status";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BackLink,
  EmptyState,
  MobileCards,
  orderTone,
  paymentLabel,
  paymentTone,
  StatusPill,
} from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

const FINISHED = new Set(["delivered", "collected", "cancelled", "refunded"]);

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("customers.read");
  const { id } = await params;
  const data = await getCustomerDesk(id);
  if (!data) notFound();
  const { customer, orders, openItems } = data;
  const digits = ghanaInternationalMsisdn(customer.phone);
  const open = orders.find((row) => !FINISHED.has(row.status));
  const paid = orders
    .filter((row) => row.paymentStatus === "paid")
    .reduce((sum, row) => sum + Number(row.total), 0);
  const address = open
    ? formatOrderAddress([open.addressLine1, open.addressLine2, open.city, open.region])
    : "";
  const wa = open
    ? customerWhatsAppHref({
        phone: customer.phone,
        publicRef: open.publicRef,
        fullName: customer.fullName,
        items: openItems,
        totalLabel: formatGhs(Number(open.total)),
        deliveryMethod: open.deliveryMethod,
        address,
        deliveryNote: open.deliveryInstructions ?? undefined,
      })
    : customerGreetingWhatsAppHref(customer.phone, customer.fullName);

  return (
    <div className="space-y-6">
      <BackLink href="/admin/customers">Work now</BackLink>
      <AdminPageHeader
        title={customer.fullName}
        description={`${customer.phone}${customer.email ? ` · ${customer.email}` : ""} · First seen ${formatAccraWhen(customer.createdAt)}`}
        action={
          <span className="flex flex-wrap gap-2">
            {customer.hasAccount ? <StatusPill value="Account" tone="ok" /> : <StatusPill value="Checkout only" tone="muted" />}
            {open ? <StatusPill value={open.status} tone={orderTone(open.status)} /> : null}
          </span>
        }
      />
      <AdminGlance
        items={[
          { label: "Orders", value: orders.length },
          { label: "Open work", value: orders.filter((row) => !FINISHED.has(row.status)).length, warn: Boolean(open) },
          { label: "Paid", value: formatGhs(paid) },
        ]}
      />
      <div className="flex max-w-xl flex-col gap-2">
        {digits.length >= 11 ? (
          <a href={`tel:+${digits}`} className={adminButton()}>
            Call
          </a>
        ) : null}
        {wa ? <OrderWhatsAppLink href={wa} labeled /> : <p className="text-sm text-muted">No WhatsApp number on this person.</p>}
      </div>

      <AdminSection title="Orders" hint="Same phone last nine digits are included, so a guest checkout still shows here.">
        {orders.length === 0 ? (
          <EmptyState title="No orders" body="This person has not placed an order yet." />
        ) : (
          <>
            <MobileCards className="mt-0">
              {orders.map((order) => (
                <li key={order.id} className="admin-panel p-4">
                  <p className="font-medium">{order.publicRef}</p>
                  <p className="mt-1 text-sm text-muted">{formatAccraWhen(order.createdAt)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <StatusPill value={order.status} tone={orderTone(order.status)} />
                    <StatusPill
                      value={order.paymentStatus}
                      tone={paymentTone(order.paymentStatus)}
                      label={paymentLabel(order.paymentStatus)}
                    />
                  </div>
                  <p className="mt-2 font-serif tabular-nums">{formatGhs(Number(order.total))}</p>
                  <Link href={`/admin/orders/${order.id}`} className={`${adminButton()} mt-3`}>
                    Open this order
                  </Link>
                </li>
              ))}
            </MobileCards>
            <AdminTable className="mt-4">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{order.publicRef}</td>
                    <td className="px-4 py-3 text-sm text-muted">{formatAccraWhen(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusPill value={order.status} tone={orderTone(order.status)} label={ORDER_STATUS_LABEL[order.status] ?? orderStatusLabel(order.status)} />
                    </td>
                    <td className="px-4 py-3 font-serif tabular-nums">{formatGhs(Number(order.total))}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className={buttonClass("secondary", "h-11 min-h-11 px-4")}>
                        Open this order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </>
        )}
      </AdminSection>
    </div>
  );
}
