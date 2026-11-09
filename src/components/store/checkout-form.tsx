"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { shopperError } from "@/lib/user-error";
import { CartPageSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CHECKOUT_DRAFT = "ak_checkout_draft";

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

const choiceClass =
  "flex min-h-12 cursor-pointer items-center gap-3 border border-border bg-background px-4 py-3.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-surface";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      {label}
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1.5 block text-xs text-pretty text-muted">{hint}</span> : null}
    </label>
  );
}

function Section({
  step,
  title,
  extra,
  children,
}: {
  step: string;
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-border bg-surface px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-2xl">
          <span className="mr-2 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            {step}
          </span>
          {title}
        </h2>
        {extra}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
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
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_DRAFT);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, string>;
      if (!customer?.email && draft.email) setEmail(draft.email);
      if (!customer?.phone && draft.phone) setPhone(draft.phone);
      if (!names.first && draft.firstName) setFirstName(draft.firstName);
      if (!names.last && draft.lastName) setLastName(draft.lastName);
      if (draft.addressLine1) setAddressLine1(draft.addressLine1);
      if (draft.addressLine2) setAddressLine2(draft.addressLine2);
      if (draft.city) setCity(draft.city);
      if (draft.notes) setNotes(draft.notes);
    } catch {
      /* ignore a bad draft */
    }
    // Restore once on open. Customer defaults stay if they were already signed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHECKOUT_DRAFT,
        JSON.stringify({
          email,
          phone,
          firstName,
          lastName,
          addressLine1,
          addressLine2,
          city,
          notes,
        }),
      );
    } catch {
      /* private mode */
    }
  }, [email, phone, firstName, lastName, addressLine1, addressLine2, city, notes]);
  const subtotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const total = subtotal;

  if (!live) {
    return <CartPageSkeleton />;
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
            <div className="relative size-16 shrink-0">
              {line.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.imageUrl} alt="" className="size-16 rounded-2xl object-cover" />
              ) : (
                <div className="size-16 rounded-2xl border border-border bg-background" />
              )}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] text-white">
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
        <div className="flex justify-between gap-4">
          <dt>Shipping</dt>
          <dd className="text-right text-muted">
            {method === "collection" ? formatGhs(0) : "Quoted on WhatsApp"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between pt-2 text-lg font-medium">
          <dt>Due now</dt>
          <dd className="price text-xl">{formatGhs(total)}</dd>
        </div>
      </dl>
      <p className="text-pretty text-xs text-muted">
        Item total is due now. Delivery, if you choose it, is confirmed on WhatsApp and is not included in this total.
        Payment is taken only when Hubtel or Moolre confirms it.
      </p>
    </div>
  );

  return (
    <form
      className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        setError(null);
        try {
          if (items.some((line) => isDemoListing(line.sku, line.slug))) {
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
          if (!result.ok) {
            setError(shopperError(result.error, "Could not place the order. Check your connection and try again."));
            return;
          }
          try {
            sessionStorage.removeItem(CHECKOUT_DRAFT);
          } catch {
            /* ignore */
          }
          clear();
          if (result.redirectUrl) {
            router.push(result.redirectUrl);
          }
        } catch (error) {
          setError(shopperError(error, "Could not place the order. Check your connection and try again."));
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="border-b border-border bg-background lg:hidden">
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-sm"
          onClick={() => setSummaryOpen((open) => !open)}
          aria-expanded={summaryOpen}
        >
          <span className="flex items-center gap-1">
            Order
            <ChevronDown className={`size-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
          </span>
          <span className="font-medium tabular-nums">{formatGhs(total)}</span>
        </button>
        {summaryOpen ? <div className="max-h-[45vh] overflow-y-auto border-t border-border px-4 py-4">{summary}</div> : null}
      </div>

      <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-8 pb-28 lg:mx-0 lg:max-w-none lg:space-y-6 lg:px-8 lg:py-10 lg:pb-10">
        <header>
          <h1 className="font-sans text-3xl font-bold uppercase tracking-[0.12em]">Checkout</h1>
          <p className="mt-2 max-w-md text-pretty text-sm text-muted">
            Pay for the pieces now. Delivery, if you want it, is quoted on WhatsApp after this order.
          </p>
        </header>

        <Section
          step="01"
          title="Contact"
          extra={
            customer ? (
              <span className="text-sm text-muted">Signed in</span>
            ) : (
              <Link href="/login?next=/checkout" className="text-sm text-accent">
                Sign in
              </Link>
            )
          }
        >
          <Field label="Email" hint="Used for the order receipt. Guest checkout is available.">
            <input
              id="email"
              type="email"
              name="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
              autoComplete="email"
            />
          </Field>
        </Section>

        <Section step="02" title="Details">
          {fulfillment.coverageNote ? <p className="text-pretty text-sm text-muted">{fulfillment.coverageNote}</p> : null}
          <p className="text-sm text-muted">Ghana</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <input
                required
                name="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="input min-w-0"
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name">
              <input
                required
                name="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="input min-w-0"
                autoComplete="family-name"
              />
            </Field>
          </div>
          <Field
            label={payWith === "moolre" ? "Mobile money number" : "Phone"}
            hint={
              payWith === "moolre"
                ? "Use the Ghana number that will receive the Moolre prompt (MTN, Telecel, or AT)."
                : undefined
            }
          >
            <input
              required
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="input"
              autoComplete="tel"
            />
          </Field>
          {method === "delivery" ? (
            <>
              <Field label="Address">
                <input
                  required
                  name="addressLine1"
                  value={addressLine1}
                  onChange={(event) => setAddressLine1(event.target.value)}
                  className="input"
                  autoComplete="address-line1"
                />
              </Field>
              <Field label="Apartment, landmark (optional)">
                <input
                  name="addressLine2"
                  value={addressLine2}
                  onChange={(event) => setAddressLine2(event.target.value)}
                  className="input"
                  autoComplete="address-line2"
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="City">
                  <input
                    required
                    name="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="input min-w-0"
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="Region">
                  <select name="region" required defaultValue="Greater Accra" className="input min-w-0" autoComplete="address-level1">
                    {GHANA_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Delivery notes (optional)">
                <textarea
                  name="deliveryInstructions"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="input min-h-20"
                />
              </Field>
            </>
          ) : (
            <p className="border border-border bg-background px-4 py-3 text-pretty text-sm text-muted">
              Collection at {defaultContact.addressLine1}, {defaultContact.city}.
            </p>
          )}
        </Section>

        <Section step="03" title="How you get it">
          <div className="space-y-2">
            {collectionOn ? (
              <label className={cn(choiceClass, "justify-between")}>
                <span className="flex min-w-0 items-center gap-3">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="collection"
                    checked={method === "collection"}
                    onChange={() => setMethod("collection")}
                    className="accent-accent"
                  />
                  Collection at the shop
                </span>
                <span className="tabular-nums">{formatGhs(0)}</span>
              </label>
            ) : null}
            {deliveryOn ? (
              <label className={cn(choiceClass, "justify-between")}>
                <span className="flex min-w-0 items-center gap-3">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={method === "delivery"}
                    onChange={() => setMethod("delivery")}
                    className="accent-accent"
                  />
                  Delivery
                </span>
                <span className="shrink-0 text-xs text-muted sm:text-sm">Quoted on WhatsApp</span>
              </label>
            ) : null}
            {!collectionOn && !deliveryOn ? (
              <p className="text-sm text-muted">
                <a href={whatsappHref} className="text-accent">
                  WhatsApp the shop
                </a>{" "}
                to arrange collection or delivery.
              </p>
            ) : null}
          </div>
          {method === "delivery" ? (
            <p className="text-pretty text-sm text-muted">
              After you pay for the items, we confirm the delivery charge and timing on{" "}
              <a href={whatsappHref} className="text-accent">
                WhatsApp
              </a>
              . It is not included in the total.
            </p>
          ) : null}
        </Section>

        <Section step="04" title="Payment">
          {paymentsReady ? (
            <div className="space-y-2">
              {paymentOptions.map((option) => (
                <label key={option.id} className={cn(choiceClass, "items-start")}>
                  <input
                    type="radio"
                    name="paymentProvider"
                    value={option.id}
                    checked={payWith === option.id}
                    onChange={() => setPayWith(option.id)}
                    className="mt-0.5 accent-accent"
                  />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="mt-1 block text-pretty text-muted">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="border border-accent bg-accent/5 px-4 py-3 text-sm">
              Online payment is not configured yet. Call or WhatsApp the shop to order. Do not treat a confirmation page
              as proof of payment.
            </p>
          )}
          {payWith === "moolre" ? (
            <fieldset>
              <legend className="mb-2 text-sm">Mobile money network</legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["13", "MTN"],
                    ["6", "Telecel"],
                    ["7", "AT"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className={cn(choiceClass, "min-h-11 justify-center px-2")}>
                    <input
                      type="radio"
                      name="momoChannel"
                      value={value}
                      checked={momoChannel === value}
                      onChange={() => setMomoChannel(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <label className="flex min-h-11 items-start gap-2 py-1 text-sm text-muted">
            <input type="checkbox" name="agree" required className="mt-1 size-4 accent-accent" />
            <span className="text-pretty">
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
        </Section>

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
        <div className="sticky top-0 px-8 py-10">
          <h2 className="mb-6 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Your order</h2>
          {summary}
        </div>
      </aside>
    </form>
  );
}
