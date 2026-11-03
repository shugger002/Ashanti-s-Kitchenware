"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ShoppingBag, Store, User } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { useClientMounted } from "@/lib/use-client-mounted";
import { cn } from "@/lib/utils";

export function MobileDock({ signedIn = false }: { signedIn?: boolean }) {
  const { count, openDrawer } = useCart();
  const pathname = usePathname();
  const cartCount = useClientMounted() ? count : 0;
  const shopActive =
    pathname === "/shop" ||
    pathname === "/products" ||
    pathname.startsWith("/shop/") ||
    pathname.startsWith("/products/");
  const accountHref = signedIn ? "/account" : "/login";
  const accountActive = pathname === "/account" || pathname === "/login" || pathname === "/register";
  const item = "flex min-h-12 flex-col items-center justify-center gap-1 py-2";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface pb-[max(0.35rem,env(safe-area-inset-bottom))] text-[11px] lg:hidden"
      aria-label="Mobile shortcuts"
    >
      <Link href="/" className={cn(item, pathname === "/" && "text-accent")} aria-current={pathname === "/" ? "page" : undefined}>
        <House className="h-5 w-5" strokeWidth={1.5} />
        Home
      </Link>
      <Link
        href="/shop"
        className={cn(item, shopActive && "text-accent")}
        aria-current={shopActive ? "page" : undefined}
      >
        <Store className="h-5 w-5" strokeWidth={1.5} />
        Category
      </Link>
      <button
        type="button"
        className={cn(item, "relative", pathname === "/cart" && "text-accent")}
        onClick={openDrawer}
      >
        <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
        {cartCount > 0 ? (
          <span className="absolute right-[18%] top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 text-white">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        ) : null}
        Cart
      </button>
      <Link
        href={accountHref}
        className={cn(item, accountActive && "text-accent")}
        aria-current={accountActive ? "page" : undefined}
      >
        <User className="h-5 w-5" strokeWidth={1.5} />
        Account
      </Link>
    </nav>
  );
}
