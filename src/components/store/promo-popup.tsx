"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { formatGhs } from "@/lib/money";
import { isDemoListing } from "@/lib/listing";
import { SalePriceBubble } from "@/components/store/sale-price";
import type { ProductCard } from "@/server/catalog/types";

export const PROMO_POPUP_INTERVAL_MS = 60 * 1000;
const ROTATE_MS = 5_000;

export function PromoPopup({ products }: { products: ProductCard[] }) {
  const titleId = useId();
  const saleItems = products.filter((item) => item.salePrice && Number(item.salePrice) < Number(item.price));
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (saleItems.length === 0 || open) return;
    const timer = window.setTimeout(() => setOpen(true), PROMO_POPUP_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [open, saleItems.length]);

  useEffect(() => {
    if (!open || paused || saleItems.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % saleItems.length),
      reduce ? ROTATE_MS * 2 : ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [open, paused, saleItems.length]);

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
    setPaused(false);
    setIndex((current) => (current + 1) % Math.max(saleItems.length, 1));
  }

  if (!open) return null;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed right-3 top-[max(5.25rem,calc(env(safe-area-inset-top)+4.75rem))] z-[55] w-[min(17.5rem,calc(100vw-1.5rem))]"
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
        }}
      >
        <button
          type="button"
          className="absolute right-1.5 top-1.5 z-10 inline-flex size-8 items-center justify-center rounded-full bg-background/90"
          aria-label="Close promo"
          onClick={dismiss}
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <Link href={`/products/${product.slug}`} onClick={dismiss} className="block">
          <div className="relative aspect-[16/10] bg-background">
            {product.primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={product.id}
                src={product.primaryImage.url}
                alt={product.primaryImage.alt || product.name}
                className="h-full w-full object-cover motion-safe:animate-[ak-promo-in_400ms_ease-out]"
              />
            ) : null}
            {discount > 0 ? (
              <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                {discount}% off
              </span>
            ) : null}
            {demo ? (
              <span className="absolute bottom-2 left-2 bg-foreground px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-background">
                Demo
              </span>
            ) : null}
          </div>
        </Link>
        <div className="p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-accent">Promo · Accra</p>
          <h2 id={titleId} className="mt-1 truncate font-serif text-lg leading-tight tracking-tight">
            {product.name}
          </h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted line-through">{formatGhs(product.price)}</span>
            <SalePriceBubble className="px-2.5 py-1 text-sm">{formatGhs(product.salePrice)}</SalePriceBubble>
          </p>
          {saleItems.length > 1 ? (
            <p className="mt-2 flex justify-center gap-1" aria-hidden>
              {saleItems.map((item, i) => (
                <span
                  key={item.id}
                  className={`h-1 rounded-full ${i === index % saleItems.length ? "w-3 bg-accent" : "w-1 bg-border"}`}
                />
              ))}
            </p>
          ) : null}
          <Link
            href={`/products/${product.slug}`}
            className="mt-2.5 inline-block text-xs text-accent"
            onClick={dismiss}
          >
            View this piece
          </Link>
        </div>
      </div>
      <style>{`
        @keyframes ak-promo-in {
          from { opacity: 0.35; }
          to { opacity: 1; }
        }
      `}</style>
    </aside>
  );
}
