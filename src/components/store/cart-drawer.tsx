"use client";

import Link from "next/link";
import { Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/components/store/cart-provider";
import { hydrateWishlist, toggleWishlist } from "@/components/store/wishlist-store";
import { pushToast } from "@/components/store/toast-store";
import { formatGhs } from "@/lib/money";
import { buttonClass } from "@/components/ui/button";
import { QuantityStepper } from "@/components/store/quantity-stepper";

export function CartDrawer() {
  const { items, count, drawerOpen, closeDrawer, update, remove } = useCart();
  useEffect(() => {
    hydrateWishlist();
  }, []);
  const subtotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close cart" onClick={closeDrawer} />
      <aside className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-background shadow-[var(--shadow)] md:bg-surface">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
          <div className="min-w-0 pt-1">
            <h2 className="font-sans text-2xl font-bold uppercase tracking-[0.12em]">My cart</h2>
            <p className="mt-0.5 text-sm text-muted tabular-nums">
              {count === 0 ? "Nothing in the bag yet" : count === 1 ? "1 piece" : `${count} pieces`}
            </p>
          </div>
          <button
            type="button"
            className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full text-muted"
            aria-label="Close cart"
            onClick={closeDrawer}
          >
            <X strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <div className="pt-8">
              <p className="text-pretty text-muted">My cart is empty.</p>
              <Link href="/shop" onClick={closeDrawer} className="mt-3 inline-flex min-h-11 items-center text-sm text-accent">
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((line) => (
                <li key={`${line.productId}-${line.variantId}`} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeDrawer}
                    className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden bg-surface outline outline-black/10 dark:outline-white/10"
                  >
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-tight text-muted">
                        No photo
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${line.slug}`}
                        onClick={closeDrawer}
                        className="font-serif text-base leading-snug tracking-tight text-pretty"
                      >
                        {line.name}
                      </Link>
                      <button
                        type="button"
                        className="flex size-9 shrink-0 items-center justify-center text-muted"
                        aria-label={`Remove ${line.name}`}
                        onClick={() => remove(line.productId, line.variantId)}
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} />
                      </button>
                    </div>
                    <p className="mt-1 text-sm tabular-nums text-accent">{formatGhs(line.unitPrice)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
                      <QuantityStepper
                        size="sm"
                        value={line.quantity}
                        label={`Quantity for ${line.name}`}
                        onChange={(next) => update(line.productId, line.variantId, next)}
                      />
                      <button
                        type="button"
                        className="min-h-10 whitespace-nowrap"
                        onClick={() => {
                          toggleWishlist({
                            productId: line.productId,
                            slug: line.slug,
                            name: line.name,
                            unitPrice: line.unitPrice,
                            imageUrl: line.imageUrl,
                          });
                          remove(line.productId, line.variantId);
                          pushToast("Moved to wishlist");
                        }}
                      >
                        Save for later
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 ? (
          <div className="border-t border-border bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="font-serif text-xl tabular-nums tracking-tight">{formatGhs(subtotal)}</span>
            </p>
            <p className="mt-2 text-pretty text-xs leading-relaxed text-muted">
              Delivery is quoted on WhatsApp after checkout. Returns for faulty items within 7 days.
            </p>
            <Link href="/checkout" onClick={closeDrawer} className={buttonClass("primary", "mt-4 h-12 w-full text-base")}>
              Checkout · {formatGhs(subtotal)}
            </Link>
            <Link href="/cart" onClick={closeDrawer} className="mt-1 block min-h-11 py-2 text-center text-sm text-muted">
              View cart
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
