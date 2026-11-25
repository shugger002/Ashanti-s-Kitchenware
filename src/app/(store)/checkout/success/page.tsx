import Link from "next/link";
import { CheckoutPaper, CheckoutShell } from "@/components/store/checkout-shell";
import { MoolreAwait } from "@/components/store/moolre-await";
import { buttonClass } from "@/components/ui/button";
import { formatGhs } from "@/lib/money";
import { pageMeta } from "@/lib/seo";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

export const metadata = pageMeta({
  title: "Order received",
  description: "Your Ashanti's Kitchenware order has been received.",
  path: "/checkout/success",
  index: false,
});

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; await?: string }>;
}) {
  const { ref, await: awaiting } = await searchParams;
  const order = ref
    ? (
        await query<{
          payment_status: string;
          delivery_method: string;
          total: string;
          shipping_amount: string;
          discount_amount: string;
          coupon_code: string | null;
        }>(
          sql`SELECT payment_status, delivery_method, total::text, shipping_amount::text, discount_amount::text, coupon_code FROM orders WHERE public_ref = ${ref}`,
        )
      ).rows[0]
    : null;
  const lines = ref
    ? (
        await query<{
          product_name: string;
          sku: string;
          quantity: number;
          line_total: string;
          slug: string | null;
        }>(sql`
          SELECT oi.product_name, oi.sku, oi.quantity, oi.line_total::text, p.slug
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           LEFT JOIN products p ON p.id = oi.product_id
           WHERE o.public_ref = ${ref}
           ORDER BY oi.id
        `)
      ).rows
    : [];
  const paymentStatus = order?.payment_status ?? "pending";
  const waitingForPrompt = paymentStatus !== "paid" && paymentStatus !== "failed" && awaiting === "momo";
  const promptFailed = paymentStatus === "failed" && awaiting === "momo";

  return (
    <CheckoutShell>
      <CheckoutPaper>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
          {paymentStatus === "paid" ? "Paid" : promptFailed ? "Not taken" : waitingForPrompt ? "Waiting" : "Recorded"}
        </p>
        <h1 className="mt-2 font-sans text-3xl font-bold uppercase tracking-[0.08em] text-balance">
          {paymentStatus === "paid"
            ? "Paid"
            : promptFailed
              ? "Payment was not approved"
              : waitingForPrompt
                ? "Approve on your phone"
                : "Order received"}
        </h1>
        <p className="mt-4 max-w-prose text-pretty text-sm leading-6 text-muted">
          {paymentStatus === "paid"
            ? "Payment has been confirmed. We will contact you about fulfilment."
            : promptFailed
              ? "Payment was not approved because the mobile money number did not have enough balance. No money was taken. Add money to the phone, then start checkout again and use the newest SMS code."
              : waitingForPrompt
                ? "Approve the Moolre prompt on your phone. This page is not proof of payment. We mark the order paid only after Moolre confirms the debit."
                : "Your order is recorded. It is not marked paid until Hubtel or Moolre confirms it, or the store records a verified payment."}
        </p>
        {waitingForPrompt && ref ? <MoolreAwait publicRef={ref} /> : null}
        {order || lines.length > 0 ? (
          <div className="mt-8 border border-border bg-surface px-4 py-5 sm:px-6">
            {ref ? (
              <p className="text-sm">
                <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Order</span>
                <span className="mt-1 block font-medium">{ref}</span>
              </p>
            ) : null}
            {order ? (
              <p className="mt-3 text-sm text-muted">
                {order.delivery_method === "collection"
                  ? "Collection at the shop."
                  : Number(order.shipping_amount) > 0
                    ? `Delivery ${formatGhs(Number(order.shipping_amount))}.`
                    : "Delivery quoted on WhatsApp."}
                {Number(order.discount_amount) > 0
                  ? ` Code ${order.coupon_code ?? ""} took ${formatGhs(Number(order.discount_amount))} off.`
                  : ""}
              </p>
            ) : null}
            {lines.length > 0 ? (
              <ul className="mt-5 space-y-4 border-t border-border pt-5 text-sm">
                {lines.map((line) => (
                  <li key={`${line.sku}-${line.product_name}`} className="flex justify-between gap-4">
                    <span className="min-w-0">
                      {line.slug ? (
                        <Link href={`/products/${line.slug}`} className="font-medium hover:text-accent">
                          {line.product_name}
                        </Link>
                      ) : (
                        <span className="font-medium">{line.product_name}</span>
                      )}
                      <span className="mt-0.5 block text-xs text-muted">
                        {line.sku} · {line.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatGhs(line.line_total)}</span>
                  </li>
                ))}
                <li className="flex items-baseline justify-between border-t border-border pt-4">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em]">Due now</span>
                  <span className="price">{formatGhs(order?.total ?? 0)}</span>
                </li>
              </ul>
            ) : null}
          </div>
        ) : ref ? (
          <p className="mt-6 text-sm">
            Order reference <strong>{ref}</strong>
          </p>
        ) : null}
        <p className="mt-6 text-sm">
          Use{" "}
          <Link href={ref ? `/orders/track?q=${encodeURIComponent(ref)}` : "/orders/track"} className="text-accent">
            track order
          </Link>{" "}
          with your phone or this order number.
        </p>
        <Link href="/shop" className={buttonClass("primary", "mt-8 h-12 w-full")}>
          Continue shopping
        </Link>
      </CheckoutPaper>
    </CheckoutShell>
  );
}
