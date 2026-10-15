"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/store/cart-provider";
import { hydrateWishlist, toggleWishlist } from "@/components/store/wishlist-store";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { formatGhs } from "@/lib/money";
import { buttonClass } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/store/quantity-stepper";

export default function CartPage() {
  const { items, update, remove, clear } = useCart();
  useEffect(() => {
    hydrateWishlist();
  }, []);
  const subtotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-36 lg:px-8 lg:py-12 lg:pb-12">
      <h1 className="text-4xl">Cart</h1>
      {items.length === 0 ? (
        <p className="mt-10 text-muted">
          Your cart is empty.{" "}
          <Link href="/shop" className="text-accent">
            Continue shopping
          </Link>
        </p>
      ) : (
        <div className="mt-10 space-y-6">
          <ul className="divide-y divide-border">
            {items.map((line) => (
              <li key={`${line.productId}-${line.variantId}`} className="flex gap-4 py-5">
                {line.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${line.slug}`} className="font-medium">
                    {line.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {line.sku} · <span className="price">{formatGhs(line.unitPrice)}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      label={`Quantity for ${line.name}`}
                      onChange={(next) => update(line.productId, line.variantId, next)}
                    />
                    <button
                      type="button"
                      className="min-h-11 text-sm text-muted"
                      onClick={() => {
                        toggleWishlist({
                          productId: line.productId,
                          slug: line.slug,
                          name: line.name,
                          unitPrice: line.unitPrice,
                          imageUrl: line.imageUrl,
                        });
                        remove(line.productId, line.variantId);
                      }}
                    >
                      Save for later
                    </button>
                    <button
                      type="button"
                      className="min-h-11 text-sm text-muted"
                      onClick={() => remove(line.productId, line.variantId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-lg">
            Subtotal <span className="price">{formatGhs(subtotal)}</span>
          </p>
          <p className="text-sm text-muted">
            Prices and stock are checked again at checkout. Delivery, if you choose it, is quoted on WhatsApp, not
            added here. Payment is taken only when online checkout is configured. Returns reminder: 7 days for faulty,
            damaged, or incorrect items.
          </p>
          <div className="hidden gap-3 lg:flex">
            <Link href="/checkout" className={buttonClass("primary")}>
              Checkout · {formatGhs(subtotal)}
            </Link>
            <Button type="button" variant="ghost" onClick={clear}>
              Clear cart
            </Button>
          </div>
          <div className="fixed inset-x-0 bottom-[var(--store-dock)] z-30 border-t border-border bg-background px-4 py-3 lg:hidden">
            <Link href="/checkout" className={buttonClass("primary", "h-12 w-full text-base")}>
              Checkout · {formatGhs(subtotal)}
            </Link>
          </div>
        </div>
      )}
      <RecentlyViewed />
    </div>
  );
}
