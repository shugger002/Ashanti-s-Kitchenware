"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useCart } from "@/components/store/cart-provider";
import {
  getServerWishlist,
  getWishlist,
  hydrateWishlist,
  removeWishlist,
  subscribeWishlist,
} from "@/components/store/wishlist-store";
import { formatGhs } from "@/lib/money";
import { buttonClass } from "@/components/ui/button";

export default function WishlistPage() {
  const items = useSyncExternalStore(subscribeWishlist, getWishlist, getServerWishlist);
  const { add } = useCart();
  useEffect(() => {
    hydrateWishlist();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 pb-24 lg:px-8 lg:pb-12">
      <h1 className="text-4xl">Wishlist</h1>
      <p className="mt-2 text-sm text-muted">Saved on this device. Sign in is not required.</p>
      {items.length === 0 ? (
        <p className="mt-10 text-muted">
          Nothing saved yet.{" "}
          <Link href="/shop" className="text-accent">
            Browse the shop
          </Link>
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-border">
          {items.map((item) => (
            <li key={item.productId} className="flex flex-wrap items-center gap-4 py-5">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              ) : null}
              <div className="flex-1">
                <Link href={`/products/${item.slug}`} className="font-medium">
                  {item.name}
                </Link>
                <p className="price">{formatGhs(item.unitPrice)}</p>
              </div>
              <button
                type="button"
                className={buttonClass("primary")}
                onClick={() =>
                  add(
                    {
                      productId: item.productId,
                      variantId: null,
                      slug: item.slug,
                      name: item.name,
                      sku: item.productId,
                      unitPrice: item.unitPrice,
                      imageUrl: item.imageUrl,
                    },
                    1,
                  )
                }
              >
                Add to cart
              </button>
              <button type="button" className="text-sm text-muted" onClick={() => removeWishlist(item.productId)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
