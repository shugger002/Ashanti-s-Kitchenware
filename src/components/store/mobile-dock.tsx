"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Search, ShoppingBag, Store } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { cn } from "@/lib/utils";

export function MobileDock({ onSearch }: { onSearch: () => void }) {
  const { count, openDrawer } = useCart();
  const pathname = usePathname();
  const shopActive =
    pathname === "/shop" ||
    pathname === "/products" ||
    pathname.startsWith("/shop/") ||
    pathname.startsWith("/products/");
  const item =
    "flex min-h-12 flex-col items-center justify-center gap-1 py-2";
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] text-[11px] lg:hidden"
      aria-label="Mobile shortcuts"
    >
      <Link href="/" className={cn(item, pathname === "/" && "text-accent")} aria-current={pathname === "/" ? "page" : undefined}>
        <House className="h-5 w-5" strokeWidth={1.5} />
        Home
      </Link>
      <Link
        href="/products"
        className={cn(
          item,
          (pathname === "/shop" ||
            pathname === "/products" ||
            pathname.startsWith("/shop/") ||
            pathname.startsWith("/products/")) &&
            "text-accent",
        )}
        aria-current={pathname === "/shop" || pathname === "/products" || pathname.startsWith("/shop/") || pathname.startsWith("/products/") ? "page" : undefined}
      >
        <Store className="h-5 w-5" strokeWidth={1.5} />
        Shop
      </Link>
      <button type="button" className={item} onClick={onSearch}>
        <Search className="h-5 w-5" strokeWidth={1.5} />
        Search
      </button>
      <Link
        href="/wishlist"
        className={cn(item, pathname === "/wishlist" && "text-accent")}
        aria-current={pathname === "/wishlist" ? "page" : undefined}
      >
        <Heart className="h-5 w-5" strokeWidth={1.5} />
        Saved
      </Link>
      <button
        type="button"
        className={cn(item, "relative", pathname === "/cart" && "text-accent")}
        onClick={openDrawer}
      >
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
