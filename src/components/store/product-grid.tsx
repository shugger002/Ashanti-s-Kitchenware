import { ProductCard } from "@/components/store/product-card";
import type { ProductCard as ProductCardType } from "@/server/catalog/types";

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  return (
    <ul className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
