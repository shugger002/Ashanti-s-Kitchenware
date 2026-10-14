import Link from "next/link";
import { CheckoutShell } from "@/components/store/checkout-shell";
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
  let paymentStatus = "pending";
  if (ref) {
    const result = await query<{ payment_status: string }>(
      sql`SELECT payment_status FROM orders WHERE public_ref = ${ref}`,
    );
    paymentStatus = result.rows[0]?.payment_status ?? "pending";
  }

  return (
    <CheckoutShell>
      <div className="mx-auto max-w-xl px-5 py-16 lg:px-8">
        <h1 className="text-4xl">Thank you</h1>
        <p className="mt-4 text-muted">
          {paymentStatus === "paid"
            ? "Payment has been confirmed. We will contact you about fulfilment."
            : awaiting === "momo"
              ? "Approve the Moolre prompt on your phone. This page is not proof of payment. We mark the order paid only after Moolre confirms the debit."
              : "Your order is recorded. It is not marked paid until Hubtel or Moolre confirms it, or the store records a verified payment."}
        </p>
        {ref ? (
          <p className="mt-4 text-sm">
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
        <Link href="/shop" className="mt-8 inline-block text-sm text-accent">
          Continue shopping
        </Link>
      </div>
    </CheckoutShell>
  );
}
