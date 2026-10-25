import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { WishlistButton } from "@/components/store/wishlist-button";
import { ProductCardActions } from "@/components/store/product-card-actions";
import type { ProductCard } from "@/server/catalog/types";
import { cn, mediaZoomClass } from "@/lib/utils";
import { OutOfStockOverlay, outOfStockImageClass } from "@/components/store/out-of-stock";
import { isDemoListing } from "@/lib/listing";
import { StarRating } from "@/components/store/star-rating";
import { SalePriceBubble } from "@/components/store/sale-price";

export function ProductCardView({
  product,
  featured = false,
  priority = false,
}: {
  product: ProductCard;
  featured?: boolean;
  priority?: boolean;
}) {
  const price = product.salePrice ?? product.price;
  const discount =
    product.salePrice && Number(product.price) > 0
      ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)
      : 0;
  const demo = isDemoListing(product.sku, product.slug);
  const canAdd = product.available > 0;
  return (
    <article className="group flex flex-col group-data-[layout=list]/catalog:flex-row group-data-[layout=list]/catalog:gap-4">
      <div
        className={cn(
          "relative overflow-hidden bg-surface",
          featured ? "aspect-[4/5]" : "aspect-square",
          "group-data-[layout=list]/catalog:aspect-auto group-data-[layout=list]/catalog:h-24 group-data-[layout=list]/catalog:w-24 group-data-[layout=list]/catalog:shrink-0 sm:group-data-[layout=list]/catalog:h-36 sm:group-data-[layout=list]/catalog:w-36",
        )}
      >
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
          {product.primaryImage?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.alt || product.name}
              className={canAdd ? cn("h-full w-full", mediaZoomClass) : outOfStockImageClass()}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">
              Photograph not uploaded yet
            </div>
          )}
          {canAdd ? null : <OutOfStockOverlay />}
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

      <div className="flex flex-1 flex-col pt-3 md:pt-4 group-data-[layout=list]/catalog:py-1 group-data-[layout=list]/catalog:pt-1">
        <h3 className="font-serif text-base leading-snug tracking-tight md:text-lg">
          <Link href={`/products/${product.slug}`} className="line-clamp-2">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1 hidden md:block group-data-[layout=list]/catalog:block">
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
        {demo ? <p className="mt-1 text-xs text-muted">Layout sample, not an offer for sale.</p> : null}
        <ProductCardActions product={product} />
      </div>
    </article>
  );
}
