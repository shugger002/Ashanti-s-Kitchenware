"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useAfterHydrate, useCart } from "@/components/store/cart-provider";
import { submitCheckout } from "@/app/(store)/checkout/actions";
import { formatGhs } from "@/lib/money";
import { Button, buttonClass } from "@/components/ui/button";
import { isDemoListing } from "@/lib/listing";
import { defaultContact } from "@/config/brand";
import type { PaymentOption } from "@/server/payments/types";

const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function CheckoutForm({
  customer,
  fulfillment,
  paymentOptions,
  whatsappE164,
}: {
  customer?: { fullName: string; email: string; phone: string } | null;
  fulfillment: {
    collectionEnabled: boolean;
    deliveryEnabled: boolean;
    coverageNote: string;
    coverage: "accra" | "nationwide";
  };
  paymentOptions: PaymentOption[];
  whatsappE164: string;
}) {
  const { items, clear } = useCart();
  const live = useAfterHydrate();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const collectionOn = fulfillment.collectionEnabled;
  const deliveryOn = fulfillment.deliveryEnabled;
  const [method, setMethod] = useState<"delivery" | "collection">(
    collectionOn ? "collection" : "delivery",
  );
  const paymentsReady = paymentOptions.length > 0;
  const whatsappHref = `https://wa.me/${whatsappE164.replace(/\D/g, "")}`;
  const [payWith, setPayWith] = useState(paymentOptions[0]?.id ?? "hubtel");
  const [momoChannel, setMomoChannel] = useState<"13" | "6" | "7">("13");
  const names = splitName(customer?.fullName ?? "");
  const [firstName, setFirstName] = useState(names.first);
  const [lastName, setLastName] = useState(names.last);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const subtotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const total = subtotal;

  if (!live) {
    return <p className="px-4 py-16 text-center text-muted">Loading checkout…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-muted">
        My cart is empty.{" "}
        <Link href="/shop" className="text-accent">
          Continue shopping
        </Link>
      </p>
    );
  }

  const summary = (
    <div className="space-y-5">
      <ul className="space-y-4">
        {items.map((line) => (
          <li key={`${line.productId}-${line.variantId}`} className="flex gap-3 text-sm">
            <div className="relative h-16 w-16 shrink-0">
              {line.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.imageUrl} alt="" className="h-16 w-16 rounded-sm border border-border object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-sm border border-border bg-background" />
              )}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] text-background">
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words font-medium leading-snug">{line.name}</p>
              <p className="mt-0.5 text-xs text-muted">{line.sku}</p>
            </div>
            <p className="shrink-0 text-right tabular-nums">{formatGhs(line.unitPrice * line.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatGhs(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="text-right text-muted">
            {method === "collection" ? formatGhs(0) : "Quoted on WhatsApp"}
          </dd>
        </div>
        <div className="flex justify-between text-lg font-medium">
          <dt>Total</dt>
          <dd className="tabular-nums">
            <span className="mr-2 text-xs font-normal uppercase tracking-wide text-muted">GHS</span>
            {formatGhs(total)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted">
        Item total is due now. Delivery, if you choose it, is confirmed on WhatsApp and is not included in this total.
        Payment is taken only when Hubtel or Moolre confirms it.
      </p>
    </div>
  );

  return (
    <form
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_26rem]"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        if (items.some((line) => isDemoListing(line.sku, line.slug))) {
          setPending(false);
          setError("Demo listings are not for sale. Remove them from the cart.");
          return;
        }
        const form = new FormData(event.currentTarget);
        form.set("fullName", `${firstName} ${lastName}`.trim());
        form.set("deliveryMethod", method);
        form.set(
          "items",
          JSON.stringify(
            items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
            })),
          ),
        );
        const result = await submitCheckout(form);
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        clear();
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        }
      }}
    >
      <div className="sticky top-14 z-30 border-b border-border bg-background lg:hidden">
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-sm"
          onClick={() => setSummaryOpen((open) => !open)}
          aria-expanded={summaryOpen}
        >
          <span className="flex items-center gap-1 text-accent">
            Order summary
            <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
          </span>
          <span className="font-medium tabular-nums">{formatGhs(total)}</span>
        </button>
        {summaryOpen ? <div className="max-h-[45vh] overflow-y-auto border-t border-border px-4 py-4">{summary}</div> : null}
      </div>

      <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-6 pb-28 lg:ml-auto lg:mr-0 lg:max-w-none lg:space-y-8 lg:px-8 lg:py-10 lg:pb-10">
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Contact</h2>
            {customer ? (
              <span className="text-sm text-muted">Signed in</span>
            ) : (
              <Link href="/login?next=/checkout" className="text-sm text-accent">
                Sign in
              </Link>
            )}
          </div>
          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            defaultValue={customer?.email}
            placeholder="Email"
            className="input"
            autoComplete="email"
          />
          <p className="text-xs text-muted">Used for the order receipt. Guest checkout is available.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Delivery</h2>
          {fulfillment.coverageNote ? <p className="text-sm text-muted">{fulfillment.coverageNote}</p> : null}
          <p className="text-sm text-muted">Ghana</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <input
              required
              name="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="First name"
              className="input min-w-0"
              autoComplete="given-name"
            />
            <input
              required
              name="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Last name"
              className="input min-w-0"
              autoComplete="family-name"
            />
          </div>
          <input
            required
            name="phone"
            defaultValue={customer?.phone}
            placeholder="Phone"
            className="input"
            autoComplete="tel"
          />
          {method === "delivery" ? (
            <>
              <input required name="addressLine1" placeholder="Address" className="input" autoComplete="address-line1" />
              <input name="addressLine2" placeholder="Apartment, landmark (optional)" className="input" autoComplete="address-line2" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                <input required name="city" placeholder="City" className="input min-w-0" autoComplete="address-level2" />
                <select name="region" required defaultValue="Greater Accra" className="input min-w-0" autoComplete="address-level1">
                  {GHANA_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <textarea name="deliveryInstructions" placeholder="Delivery notes (optional)" className="input min-h-20" />
            </>
          ) : (
            <p className="rounded-sm border border-border bg-surface px-3 py-3 text-sm text-muted">
              Collection at {defaultContact.addressLine1}, {defaultContact.city}.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Shipping method</h2>
          <div className="overflow-hidden rounded-sm border border-border">
            {collectionOn ? (
              <label className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3 py-3 sm:px-4 ${method === "collection" ? "bg-surface" : ""}`}>
                <span className="flex min-w-0 items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="collection"
                    checked={method === "collection"}
                    onChange={() => setMethod("collection")}
                  />
                  Collection at the shop
                </span>
                <span className="text-sm tabular-nums">{formatGhs(0)}</span>
              </label>
            ) : null}
            {deliveryOn ? (
              <label
                className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3 py-3 sm:px-4 ${collectionOn ? "border-t border-border" : ""} ${method === "delivery" ? "bg-surface" : ""}`}
              >
                <span className="flex min-w-0 items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={method === "delivery"}
                    onChange={() => setMethod("delivery")}
                  />
                  Delivery
                </span>
                <span className="shrink-0 text-xs text-muted sm:text-sm">Quoted on WhatsApp</span>
              </label>
            ) : null}
            {!collectionOn && !deliveryOn ? (
              <p className="px-4 py-3 text-sm text-muted">
                <a href={whatsappHref} className="text-accent">
                  WhatsApp the shop
                </a>{" "}
                to arrange collection or delivery.
              </p>
            ) : null}
          </div>
          {method === "delivery" ? (
            <p className="text-sm text-muted">
              After you pay for the items, we confirm the delivery charge and timing on{" "}
              <a href={whatsappHref} className="text-accent">
                WhatsApp
              </a>
              . It is not included in the total above.
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Payment</h2>
          <p className="text-sm text-muted">All transactions are secure and encrypted.</p>
          {paymentsReady ? (
            <div className="overflow-hidden rounded-sm border border-border">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 border-b border-border px-3 py-3 last:border-b-0 sm:px-4 ${payWith === option.id ? "bg-surface" : ""}`}
                >
                  <input
                    type="radio"
                    name="paymentProvider"
                    value={option.id}
                    checked={payWith === option.id}
                    onChange={() => setPayWith(option.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-1 block text-sm text-muted">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-sm border border-accent bg-accent/5 px-4 py-3 text-sm">
              Online payment is not configured yet. Call or WhatsApp the shop to order. Do not treat a confirmation page
              as proof of payment.
            </p>
          )}
          {payWith === "moolre" ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Mobile money network</legend>
              {(
                [
                  ["13", "MTN"],
                  ["6", "Telecel"],
                  ["7", "AT"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="momoChannel"
                    value={value}
                    checked={momoChannel === value}
                    onChange={() => setMomoChannel(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          ) : null}
          <label className="flex min-h-11 items-start gap-2 py-1 text-sm text-muted">
            <input type="checkbox" name="agree" required className="mt-1 size-4" />
            <span>
              By paying, you agree to our{" "}
              <Link href="/terms" className="underline">
                Terms of service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy policy
              </Link>
              .
            </span>
          </label>
        </section>

        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        {error ? <p className="text-sm text-red-800">{error}</p> : null}

        {paymentsReady ? (
          <Button type="submit" className="hidden h-14 w-full text-base lg:inline-flex" disabled={pending}>
            {pending ? "Placing order…" : `Pay now · ${formatGhs(total)}`}
          </Button>
        ) : (
          <a
            href={whatsappHref}
            className={`${buttonClass("primary", "hidden h-14 w-full text-base lg:inline-flex")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp to order · {formatGhs(total)}
          </a>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        {error ? <p className="mb-2 text-sm text-red-800">{error}</p> : null}
        {paymentsReady ? (
          <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
            {pending ? "Placing order…" : `Pay now · ${formatGhs(total)}`}
          </Button>
        ) : (
          <a href={whatsappHref} className={buttonClass("primary", "h-12 w-full text-base")} target="_blank" rel="noopener noreferrer">
            WhatsApp to order · {formatGhs(total)}
          </a>
        )}
      </div>

      <aside className="hidden border-l border-border bg-surface lg:block">
        <div className="sticky top-0 px-8 py-10">{summary}</div>
      </aside>
    </form>
  );
}
