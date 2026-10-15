"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { brand } from "@/config/brand";
import { StoreLogo } from "@/components/store/logo";
import { ThemeToggle } from "@/components/store/theme-toggle";
import { useCart } from "@/components/store/cart-provider";
import { useWishlistCount } from "@/components/store/wishlist-button";
import { cn } from "@/lib/utils";

type CategoryLink = { slug: string; name: string };

function navActive(pathname: string, href: string) {
  const pathOnly = href.split("#")[0] ?? href;
  if (pathOnly === "/") return pathname === "/";
  if (pathOnly === "/products" || pathOnly === "/shop") {
    return pathname === "/shop" || pathname === "/products" || pathname.startsWith("/shop/") || pathname.startsWith("/products/");
  }
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

export function StoreHeader({
  signedIn = false,
  categories = [],
  menuOpen,
  onMenuOpenChange,
  onSearch,
}: {
  signedIn?: boolean;
  categories?: CategoryLink[];
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onSearch: () => void;
}) {
  const { count, openDrawer } = useCart();
  const pathname = usePathname();
  const wishCount = useWishlistCount();

  useEffect(() => {
    onMenuOpenChange(false);
  }, [pathname, onMenuOpenChange]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const desktop = [
    { href: "/products", label: "Shop" },
    { href: "/promo", label: "Promo" },
    { href: "/journal", label: "Guides" },
    { href: "/about", label: "About" },
  ];

  const menuPrimary = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/promo", label: "Promo" },
  ];
  const menuAfterCategories = [
    { href: "/faq#payments", label: "Payments" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/directions", label: "Get Directions" },
  ];
  const menuSecondary = [
    { href: "/orders/track", label: "Track Order" },
    { href: "/wishlist", label: "Wishlist" },
    { href: signedIn ? "/account" : "/login", label: "My Account" },
  ];
  const menuRow =
    "block py-3.5 text-[17px] leading-snug tracking-tight text-[#2c3544] hover:text-accent";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 lg:h-16 lg:gap-8 lg:px-8">
        <button
          type="button"
          className="-ml-1 inline-flex size-10 shrink-0 items-center justify-center"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="store-menu"
          onClick={() => onMenuOpenChange(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
        </button>
        <Link href="/" className="flex min-w-0 flex-1 items-center lg:flex-none" aria-label={brand.name}>
          <StoreLogo className="h-7 w-auto max-w-[8.5rem] sm:h-8 sm:max-w-[12rem] lg:h-10 lg:max-w-[14rem]" />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-7 text-[13px] lg:flex" aria-label="Primary">
          {desktop.map((item) => {
            const pathOnly = item.href.split("?")[0] ?? item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "tracking-wide transition-colors hover:text-accent",
                  navActive(pathname, pathOnly) && "text-accent",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {categories.length > 0 ? (
            <details className="relative">
              <summary className="cursor-pointer list-none tracking-wide hover:text-accent [&::-webkit-details-marker]:hidden">
                Categories
              </summary>
              <div className="absolute left-0 top-full z-50 mt-3 min-w-52 border border-border bg-surface p-2 shadow-[var(--shadow)]">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/shop/${category.slug}`}
                    className="block px-3 py-2 text-sm hover:bg-background"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden lg:inline-flex">
            <ThemeToggle />
          </span>
          <button type="button" aria-label="Search products" className="hidden lg:inline-flex" onClick={onSearch}>
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Link href="/wishlist" aria-label={`Wishlist, ${wishCount} items`} className="relative hidden lg:inline-flex">
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            {wishCount > 0 ? (
              <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 text-white">
                {wishCount}
              </span>
            ) : null}
          </Link>
          <Link href={signedIn ? "/account" : "/login"} aria-label={signedIn ? "Your account" : "Sign in"} className="hidden lg:inline-flex">
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <button type="button" className="relative" aria-label={`Cart, ${count} items`} onClick={openDrawer}>
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {count > 0 ? (
              <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 text-white">
                {count}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      {menuOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80]" id="store-menu">
              <button
                type="button"
                className="absolute inset-0 bg-foreground/35"
                aria-label="Close menu"
                onClick={() => onMenuOpenChange(false)}
              />
              <nav
                className="relative flex h-full w-[min(22rem,86vw)] flex-col bg-background shadow-[var(--shadow)]"
                aria-label="Menu"
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <StoreLogo className="h-8 w-auto max-w-[11rem]" />
                  <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center"
                    aria-label="Close menu"
                    onClick={() => onMenuOpenChange(false)}
                  >
                    <X className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 pb-[max(6rem,env(safe-area-inset-bottom))]">
                  <ul>
                    {menuPrimary.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(menuRow, navActive(pathname, item.href) && "text-accent")}
                          onClick={() => onMenuOpenChange(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      {categories.length > 0 ? (
                        <details className="group">
                          <summary className={`${menuRow} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                            Categories
                          </summary>
                          <ul className="mb-2 ml-3 border-l border-border pl-3">
                            {categories.map((category) => (
                              <li key={category.slug}>
                                <Link
                                  href={`/shop/${category.slug}`}
                                  className="block py-2.5 text-[15px] text-[#2c3544] hover:text-accent"
                                  onClick={() => onMenuOpenChange(false)}
                                >
                                  {category.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <Link href="/shop" className={menuRow} onClick={() => onMenuOpenChange(false)}>
                          Categories
                        </Link>
                      )}
                    </li>
                    {menuAfterCategories.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(menuRow, navActive(pathname, item.href) && "text-accent")}
                          onClick={() => onMenuOpenChange(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <hr className="my-3 border-border" />
                  <ul>
                    {menuSecondary.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(menuRow, navActive(pathname, item.href) && "text-accent")}
                          onClick={() => onMenuOpenChange(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
