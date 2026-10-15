"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { ProductCardView } from "@/components/store/product-card";
import type { ProductCard } from "@/server/catalog/types";

export function ProductGrid({ products }: { products: ProductCard[] }) {
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  return (
    <div>
      <div className="mb-6 flex justify-end gap-2">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border"
          aria-pressed={layout === "grid"}
          aria-label="Grid view"
          onClick={() => setLayout("grid")}
        >
          <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border"
          aria-pressed={layout === "list"}
          aria-label="List view"
          onClick={() => setLayout("list")}
        >
          <List className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className={layout === "grid" ? "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4" : "flex flex-col gap-5 sm:gap-8"}>
        {products.map((product) => (
          <ProductCardView key={product.id} product={product} layout={layout} />
        ))}
      </div>
    </div>
  );
}
