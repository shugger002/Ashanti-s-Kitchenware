"use client";

import Link from "next/link";
import { Heart, House, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";

export function MobileDock({ onSearch }: { onSearch: () => void }) {
  const { count, openDrawer } = useCart();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] text-[11px] lg:hidden"
      aria-label="Mobile shortcuts"
    >
      <Link href="/" className="flex min-h-11 flex-col items-center justify-center gap-1 py-2">
        <House className="h-5 w-5" strokeWidth={1.5} />
        Home
      </Link>
      <button type="button" className="flex min-h-11 flex-col items-center justify-center gap-1 py-2" onClick={onSearch}>
        <Search className="h-5 w-5" strokeWidth={1.5} />
        Search
      </button>
      <Link href="/wishlist" className="flex min-h-11 flex-col items-center justify-center gap-1 py-2">
        <Heart className="h-5 w-5" strokeWidth={1.5} />
        Saved
      </Link>
      <button type="button" className="relative flex min-h-11 flex-col items-center justify-center gap-1 py-2" onClick={openDrawer}>
        <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
        {count > 0 ? (
          <span className="absolute right-[18%] top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
        Cart
      </button>
    </nav>
  );
}
