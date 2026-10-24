"use client";

import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { useCart } from "@/components/store/cart-provider";
import { WishlistButton } from "@/components/store/wishlist-button";
import { pushToast } from "@/components/store/toast-store";
import { buttonClass } from "@/components/ui/button";
import type { ProductCard } from "@/server/catalog/types";
import { cn, mediaZoomClass } from "@/lib/utils";
import { OutOfStockOverlay, outOfStockImageClass } from "@/components/store/out-of-stock";
import { isDemoListing } from "@/lib/listing";
import { colorsForCard, MAX_VISIBLE_SWATCHES } from "@/lib/product-color";
import { ColorSwatches } from "@/components/store/color-swatches";
import { StarRating } from "@/components/store/star-rating";
import { SalePriceBubble } from "@/components/store/sale-price";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { useState } from "react";

export function ProductCardView({
  product,
  featured = false,
  layout = "grid",
}: {
  product: ProductCard;
  featured?: boolean;
  layout?: "grid" | "list";
}) {
  const { add } = useCart();
  const colors = colorsForCard(product.colors, product.name);
  const [qty, setQty] = useState(1);
  const [colorId, setColorId] = useState(colors[0]?.variantId || null);
  const selectedColor = colors.find((color) => color.variantId === colorId) ?? colors[0] ?? null;
  const hasRealColour = Boolean(selectedColor?.variantId);
  const price = product.salePrice ?? product.price;
  const discount =
    product.salePrice && Number(product.price) > 0
      ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)
      : 0;

  const demo = isDemoListing(product.sku, product.slug);
  const canAdd = product.available > 0;

  function addLine() {
    if (!canAdd) {
      pushToast("This piece is currently unavailable");
      return;
    }
    add(
      {
        productId: product.id,
        variantId: hasRealColour ? selectedColor?.variantId ?? null : null,
        slug: product.slug,
        name: hasRealColour && selectedColor ? `${product.name}, ${selectedColor.name}` : product.name,
        sku: product.sku,
        unitPrice: Number(price),
        imageUrl: product.primaryImage?.url ?? null,
      },
      qty,
    );
    pushToast(qty > 1 ? `Added ${qty} × ${product.name} to cart` : `Added ${product.name} to cart`);
  }

  return (
    <article className={cn("group flex", layout === "list" ? "flex-row gap-4" : "flex-col")}>
      <div
        className={cn(
          "relative overflow-hidden bg-surface",
          layout === "list" ? "h-24 w-24 shrink-0 sm:h-36 sm:w-36" : featured ? "aspect-[4/5]" : "aspect-square",
        )}
      >
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
          {product.primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.alt || product.name}
              className={canAdd ? cn("h-full w-full", mediaZoomClass) : outOfStockImageClass()}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">
              Photograph not uploaded yet
            </div>
          )}
          {canAdd ? null : <OutOfStockOverlay compact={layout === "list"} />}
          <span className="sr-only">{canAdd ? product.name : `${product.name}, out of stock`}</span>
        </Link>
        <span className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1">
          {demo ? (
            <span className="bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-wide text-background">Demo</span>
          ) : null}
          {discount > 0 ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
              −{discount}%
            </span>
          ) : null}
        </span>
        <div className="absolute right-3 top-3 z-10">
          <WishlistButton
            className="bg-surface/90"
            item={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              unitPrice: Number(price),
              imageUrl: product.primaryImage?.url ?? null,
            }}
          />
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col", layout === "list" ? "py-1" : "pt-3 md:pt-4")}>
        <h3 className="font-serif text-base leading-snug tracking-tight md:text-lg">
          <Link href={`/products/${product.slug}`} className="line-clamp-2">
            {product.name}
          </Link>
        </h3>
        <div className={cn("mt-1", layout === "grid" && "hidden md:block")}>
          <StarRating average={product.ratingAverage} count={product.reviewCount} compact />
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="text-sm text-muted line-through md:text-base">{formatGhs(Number(product.price))}</span>
              <SalePriceBubble>{formatGhs(Number(price))}</SalePriceBubble>
            </>
          ) : (
            <span className="price text-lg md:text-[1.375rem]">{formatGhs(Number(price))}</span>
          )}
        </p>
        <div className={cn("mt-3 min-h-8", layout === "grid" && "hidden md:block")}>
          <ColorSwatches
            colors={colors}
            value={colorId || colors[0]?.variantId || null}
            onChange={setColorId}
            moreHref={product.colors.length > MAX_VISIBLE_SWATCHES ? `/products/${product.slug}` : undefined}
            showLabel={false}
          />
        </div>
        {demo ? <p className="mt-1 text-xs text-muted">Layout sample, not an offer for sale.</p> : null}
        <div className="mt-3 flex items-center gap-2 md:mt-4">
          <div className="hidden md:block">
            <QuantityStepper size="sm" value={qty} onChange={setQty} min={1} max={Math.max(product.available, 1)} />
          </div>
          <button
            type="button"
            disabled={!canAdd}
            className={buttonClass("primary", "h-11 min-h-11 min-w-0 flex-1 px-3 text-sm")}
            onClick={addLine}
          >
            {canAdd ? "Add to cart" : "Out of stock"}
          </button>
        </div>
      </div>
    </article>
  );
}
