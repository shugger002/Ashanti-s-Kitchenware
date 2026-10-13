"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { formatGhs } from "@/lib/money";
import { isDemoListing } from "@/lib/listing";
import { buttonClass } from "@/components/ui/button";
import { SalePriceBubble } from "@/components/store/sale-price";
import type { ProductCard } from "@/server/catalog/types";

export const PROMO_POPUP_INTERVAL_MS = 60 * 1000;

export function PromoPopup({ products }: { products: ProductCard[] }) {
  const titleId = useId();
  const saleItems = products.filter((item) => item.salePrice && Number(item.salePrice) < Number(item.price));
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (saleItems.length === 0 || open) return;
    const timer = window.setTimeout(() => setOpen(true), PROMO_POPUP_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [open, saleItems.length]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (saleItems.length === 0) return null;
  const product = saleItems[index % saleItems.length];
  if (!product?.salePrice) return null;

  const discount = Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100);
  const demo = isDemoListing(product.sku, product.slug);

  function dismiss() {
    setOpen(false);
    setIndex((current) => current + 1);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 pb-[calc(var(--store-dock)+1rem)] sm:items-center sm:pb-4">
      <button type="button" className="absolute inset-0 bg-foreground/45" aria-label="Dismiss promo" onClick={dismiss} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow)]"
      >
        <button
          type="button"
          className="absolute right-2 top-2 z-10 inline-flex size-10 items-center justify-center rounded-full bg-background/90"
          aria-label="Close promo"
          onClick={dismiss}
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <Link href={`/products/${product.slug}`} onClick={dismiss} className="block">
          <div className="relative aspect-[4/3] bg-background">
            {product.primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.primaryImage.url}
                alt={product.primaryImage.alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : null}
            {discount > 0 ? (
              <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white">
                {discount}% off
              </span>
            ) : null}
            {demo ? (
              <span className="absolute bottom-3 left-3 bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-wide text-background">
                Demo
              </span>
            ) : null}
          </div>
        </Link>
        <div className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Promo · Accra</p>
          <h2 id={titleId} className="mt-2 font-serif text-2xl tracking-tight">
            {product.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This listing has a reduced Ghana Cedi price the shop entered. Not a blanket discount on the store.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted line-through">{formatGhs(product.price)}</span>
            <SalePriceBubble className="text-base">{formatGhs(product.salePrice)}</SalePriceBubble>
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href={`/products/${product.slug}`} className={buttonClass("primary")} onClick={dismiss}>
              View this piece
            </Link>
            <Link href="/promo" className="text-center text-sm text-accent" onClick={dismiss}>
              See every reduced price
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
