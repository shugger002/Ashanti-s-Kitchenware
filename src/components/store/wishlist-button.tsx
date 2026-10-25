"use client";

import { Heart } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { pushToast } from "@/components/store/toast-store";
import {
  getServerWishlist,
  getWishlist,
  hydrateWishlist,
  isWishlisted,
  subscribeWishlist,
  toggleWishlist,
  type WishlistItem,
} from "@/components/store/wishlist-store";
import { cn } from "@/lib/utils";

export function WishlistHydrator() {
  useEffect(() => {
    hydrateWishlist();
  }, []);
  return null;
}

export function WishlistButton({ item, className }: { item: WishlistItem; className?: string }) {
  const list = useSyncExternalStore(subscribeWishlist, getWishlist, getServerWishlist);
  const on = list.some((entry) => entry.productId === item.productId);

  return (
    <button
      type="button"
      className={cn("inline-flex size-10 items-center justify-center rounded-full p-2 text-muted hover:text-accent", className)}
      aria-pressed={on}
      aria-label={on ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
      onClick={() => {
        toggleWishlist(item);
        pushToast(isWishlisted(item.productId) ? "Saved to wishlist" : "Removed from wishlist");
      }}
    >
      <Heart className={cn("h-4 w-4", on && "fill-accent text-accent")} strokeWidth={1.5} />
    </button>
  );
}

export function useWishlistCount() {
  const list = useSyncExternalStore(subscribeWishlist, getWishlist, getServerWishlist);
  useEffect(() => {
    hydrateWishlist();
  }, []);
  return list.length;
}
