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
        }>(
          sql`SELECT payment_status, delivery_method, total::text FROM orders WHERE public_ref = ${ref}`,
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

  return (
    <CheckoutShell>
      <CheckoutPaper>
        <h1 className="text-3xl text-balance md:text-4xl">
          {paymentStatus === "paid" ? "Paid" : awaiting === "momo" ? "Approve on your phone" : "Order received"}
        </h1>
        <p className="mt-4 text-pretty text-muted">
          {paymentStatus === "paid"
            ? "Payment has been confirmed. We will contact you about fulfilment."
            : awaiting === "momo"
              ? "Approve the Moolre prompt on your phone. This page is not proof of payment. We mark the order paid only after Moolre confirms the debit."
              : "Your order is recorded. It is not marked paid until Hubtel or Moolre confirms it, or the store records a verified payment."}
        </p>
        {paymentStatus !== "paid" && awaiting === "momo" && ref ? <MoolreAwait publicRef={ref} /> : null}
        {ref ? (
          <p className="mt-4 text-sm">
            Order reference <strong>{ref}</strong>
          </p>
        ) : null}
        {order ? (
          <p className="mt-1 text-sm text-muted">
            {order.delivery_method === "collection" ? "Collection at the shop." : "Delivery quoted on WhatsApp."}
          </p>
        ) : null}
        {lines.length > 0 ? (
          <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
            {lines.map((line) => (
              <li key={`${line.sku}-${line.product_name}`} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {line.slug ? (
                    <Link href={`/products/${line.slug}`} className="hover:text-accent">
                      {line.product_name}
                    </Link>
                  ) : (
                    line.product_name
                  )}
                  <span className="mt-0.5 block text-xs text-muted">
                    {line.sku} · {line.quantity}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatGhs(line.line_total)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-border pt-3 font-medium">
              <span>Due now</span>
              <span className="tabular-nums">{formatGhs(order?.total ?? 0)}</span>
            </li>
          </ul>
        ) : null}
        <p className="mt-6 text-sm">
          Use{" "}
          <Link href={ref ? `/orders/track?q=${encodeURIComponent(ref)}` : "/orders/track"} className="text-accent">
            track order
          </Link>{" "}
          with your phone or this order number.
        </p>
        <Link href="/shop" className={buttonClass("primary", "mt-8 h-12 w-full sm:w-auto")}>
          Continue shopping
        </Link>
      </CheckoutPaper>
    </CheckoutShell>
  );
}
