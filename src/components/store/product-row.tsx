import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { StarRating } from "@/components/store/star-rating";
import { OutOfStockOverlay, outOfStockImageClass } from "@/components/store/out-of-stock";
import { isDemoListing } from "@/lib/listing";
import type { ProductCard } from "@/server/catalog/types";
import { cn } from "@/lib/utils";

export function ProductRow({ product, priority = false }: { product: ProductCard; priority?: boolean }) {
  const price = product.salePrice ?? product.price;
  const inStock = product.available > 0;
  const demo = isDemoListing(product.sku, product.slug);

  return (
    <article className="flex gap-3 py-3 md:gap-4 md:py-4">
      <Link
        href={`/products/${product.slug}`}
        className="relative size-[4.75rem] shrink-0 overflow-hidden rounded-sm bg-background sm:size-20 md:size-24"
      >
        {product.primaryImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImage.url}
            alt={product.primaryImage.alt || product.name}
            className={cn("size-full object-contain p-1", !inStock && outOfStockImageClass("object-contain blur-[4px]"))}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        ) : (
          <span className="flex size-full items-center justify-center px-2 text-center text-[10px] text-muted">
            No photo
          </span>
        )}
        {inStock ? null : <OutOfStockOverlay compact />}
        <span className="sr-only">{inStock ? product.name : `${product.name}, out of stock`}</span>
      </Link>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-snug text-pretty">
          <Link href={`/products/${product.slug}`} className="line-clamp-2">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1">
          <StarRating average={product.ratingAverage} count={product.reviewCount} compact />
        </div>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums">
          <span className="text-sm font-bold">{formatGhs(Number(price))}</span>
          {product.salePrice ? (
            <span className="text-xs text-muted line-through">{formatGhs(Number(product.price))}</span>
          ) : null}
        </p>
        {demo ? <p className="mt-1 text-xs text-muted">Layout sample, not an offer for sale.</p> : null}
      </div>
    </article>
  );
}
