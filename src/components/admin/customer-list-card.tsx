import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { formatAccraWhen } from "@/lib/accra-time";
import { ghanaInternationalMsisdn } from "@/lib/phone-gh";
import { customerGreetingWhatsAppHref } from "@/lib/order-whatsapp";
import { orderStatusLabel } from "@/lib/order-status";
import type { CustomerListItem } from "@/server/customers/service";
import { OrderWhatsAppLink } from "@/components/admin/whatsapp-link";
import { adminButton, StatusPill } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

export function CustomerListCard({ person }: { person: CustomerListItem }) {
  const digits = ghanaInternationalMsisdn(person.phone);
  const wa = customerGreetingWhatsAppHref(person.phone, person.fullName);
  const last =
    person.lastOrderRef && person.lastOrderStatus
      ? `${person.lastOrderRef} · ${orderStatusLabel(person.lastOrderStatus)}`
      : "No orders yet";
  return (
    <article className="admin-panel space-y-4">
      <header>
        <p className="font-serif text-2xl leading-tight">{person.fullName}</p>
        <p className="mt-1 text-sm text-muted">{formatAccraWhen(person.createdAt)}</p>
      </header>
      <div className="flex flex-wrap gap-1">
        {person.openCount > 0 ? <StatusPill value="Open work" tone="attention" /> : null}
        {person.hasAccount ? <StatusPill value="Account" tone="ok" /> : null}
      </div>
      <p className="text-sm">{person.phone}</p>
      {person.email ? <p className="text-sm text-muted">{person.email}</p> : null}
      <p className="text-sm">{last}</p>
      <p className="font-serif text-sm tabular-nums">
        {person.orderCount} {person.orderCount === 1 ? "order" : "orders"} · {formatGhs(Number(person.paidTotal))}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href={`/admin/customers/${person.id}`} className={adminButton()}>
          Open this person
        </Link>
        {digits.length >= 11 ? (
          <a href={`tel:+${digits}`} className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
            Call
          </a>
        ) : null}
        {wa ? <OrderWhatsAppLink href={wa} labeled /> : <p className="text-xs text-muted">No WhatsApp number on this person.</p>}
      </div>
    </article>
  );
}

export function CustomerTableRow({ person }: { person: CustomerListItem }) {
  const digits = ghanaInternationalMsisdn(person.phone);
  const wa = customerGreetingWhatsAppHref(person.phone, person.fullName);
  return (
    <tr className="border-b border-border last:border-0 align-top hover:bg-surface">
      <td className="px-4 py-3">
        <p className="font-medium">{person.fullName}</p>
        <p className="mt-0.5 text-xs text-muted">{formatAccraWhen(person.createdAt)}</p>
        {person.openCount > 0 ? (
          <span className="mt-1 inline-block">
            <StatusPill value="Open work" tone="attention" />
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3">
        {digits.length >= 11 ? (
          <a href={`tel:+${digits}`} className="text-accent">
            {person.phone}
          </a>
        ) : (
          person.phone
        )}
      </td>
      <td className="px-4 py-3 text-muted">{person.email ?? "—"}</td>
      <td className="px-4 py-3 text-sm">
        {person.lastOrderRef ? `${person.lastOrderRef}` : "—"}
        {person.lastOrderStatus ? (
          <span className="mt-0.5 block text-xs text-muted">{orderStatusLabel(person.lastOrderStatus)}</span>
        ) : null}
      </td>
      <td className="px-4 py-3 font-serif tabular-nums">{person.orderCount}</td>
      <td className="px-4 py-3 font-serif tabular-nums">{formatGhs(Number(person.paidTotal))}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <Link href={`/admin/customers/${person.id}`} className={adminButton("h-11 min-h-11 px-4")}>
            Open this person
          </Link>
          {digits.length >= 11 ? (
            <a href={`tel:+${digits}`} className={buttonClass("secondary", "h-11 min-h-11 px-4")}>
              Call
            </a>
          ) : null}
          {wa ? <OrderWhatsAppLink href={wa} /> : null}
        </div>
      </td>
    </tr>
  );
}
