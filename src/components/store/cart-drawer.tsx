"use client";

import Link from "next/link";
import { ShoppingBag, Trash2, X } from "lucide-react";
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
      <aside className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em]">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Your cart
            {count > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium normal-case tracking-normal text-white">
                {count}
              </span>
            ) : null}
          </h2>
          <button type="button" className="flex h-11 w-11 items-center justify-center" aria-label="Close cart" onClick={closeDrawer}>
            <X strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted">Your cart is empty.</p>
          ) : (
            <ul className="space-y-5">
              {items.map((line) => (
                <li key={`${line.productId}-${line.variantId}`} className="flex gap-3 text-sm">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-sm object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/products/${line.slug}`} onClick={closeDrawer} className="font-medium leading-snug text-accent">
                        {line.name}
                      </Link>
                      <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center text-muted"
                        aria-label={`Remove ${line.name}`}
                        onClick={() => remove(line.productId, line.variantId)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                    <p className="mt-1 tabular-nums">{formatGhs(line.unitPrice)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
                      <QuantityStepper
                        size="sm"
                        value={line.quantity}
                        label={`Quantity for ${line.name}`}
                        onChange={(next) => update(line.productId, line.variantId, next)}
                      />
                      <button
                        type="button"
                        className="min-h-9 whitespace-nowrap"
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
        <div className="border-t border-border px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="mb-1 flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span className="text-base font-medium tabular-nums">{formatGhs(subtotal)}</span>
          </p>
          <p className="mb-3 text-xs text-muted">
            Delivery is quoted on WhatsApp after checkout. Returns for faulty items within 7 days.
          </p>
          <Link
            href="/checkout"
            onClick={closeDrawer}
            className={buttonClass("primary", "h-12 w-full text-base")}
          >
            Checkout · {formatGhs(subtotal)}
          </Link>
          <Link href="/cart" onClick={closeDrawer} className="mt-3 block min-h-11 py-2 text-center text-sm text-muted">
            View cart
          </Link>
        </div>
      </aside>
    </div>
  );
}
