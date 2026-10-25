import { ProductCardView } from "@/components/store/product-card";
import { ProductGridShell } from "@/components/store/product-grid-shell";
import type { ProductCard } from "@/server/catalog/types";

export function ProductGrid({
  products,
  countLabel,
}: {
  products: ProductCard[];
  countLabel?: string;
}) {
  return (
    <ProductGridShell countLabel={countLabel}>
      {products.map((product, index) => (
        <ProductCardView key={product.id} product={product} priority={index < 4} />
      ))}
    </ProductGridShell>
  );
}
