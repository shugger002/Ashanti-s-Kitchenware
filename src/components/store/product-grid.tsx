"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { ProductCardView } from "@/components/store/product-card";
import type { ProductCard } from "@/server/catalog/types";

export function ProductGrid({
  products,
  countLabel,
}: {
  products: ProductCard[];
  countLabel?: string;
}) {
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  return (
    <div>
      <div className={countLabel ? "mb-4 flex items-center justify-between gap-3" : "mb-4 hidden items-center justify-end gap-3 md:flex"}>
        {countLabel ? <p className="text-sm tabular-nums text-muted">{countLabel}</p> : null}
        <div className="flex gap-1">
          <button
            type="button"
            className={`inline-flex size-11 items-center justify-center rounded-xl border ${layout === "grid" ? "border-foreground/20 bg-surface" : "border-transparent"}`}
            aria-pressed={layout === "grid"}
            aria-label="Grid view"
            onClick={() => setLayout("grid")}
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={`inline-flex size-11 items-center justify-center rounded-xl border ${layout === "list" ? "border-foreground/20 bg-surface" : "border-transparent"}`}
            aria-pressed={layout === "list"}
            aria-label="List view"
            onClick={() => setLayout("list")}
          >
            <List className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className={layout === "grid" ? "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4" : "flex flex-col gap-5 sm:gap-8"}>
        {products.map((product) => (
          <ProductCardView key={product.id} product={product} layout={layout} />
        ))}
      </div>
    </div>
  );
}
