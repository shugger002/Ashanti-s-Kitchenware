import { ProductCardView } from "@/components/store/product-card";
import { ProductRailScroller } from "@/components/store/product-rail-scroller";
import type { ProductCard } from "@/server/catalog/types";

export function ProductRail({
  products,
  className,
}: {
  products: ProductCard[];
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <ProductRailScroller className={className}>
      {products.map((product, index) => (
        <div
          key={product.id}
          data-rail-card
          className="w-[70%] min-w-[70%] shrink-0 snap-start sm:w-[46%] sm:min-w-[46%] lg:w-[28%] lg:min-w-[28%]"
        >
          <ProductCardView product={product} priority={index < 2} />
        </div>
      ))}
    </ProductRailScroller>
  );
}
