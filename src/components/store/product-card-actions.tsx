"use client";

import { useState } from "react";
import { useCart } from "@/components/store/cart-provider";
import { pushToast } from "@/components/store/toast-store";
import { ColorSwatches } from "@/components/store/color-swatches";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { buttonClass } from "@/components/ui/button";
import { colorsForCard, MAX_VISIBLE_SWATCHES } from "@/lib/product-color";
import type { ProductCard } from "@/server/catalog/types";

export function ProductCardActions({ product }: { product: ProductCard }) {
  const { add } = useCart();
  const colors = colorsForCard(product.colors, product.name);
  const [qty, setQty] = useState(1);
  const [colorId, setColorId] = useState(colors[0]?.variantId || null);
  const selectedColor = colors.find((color) => color.variantId === colorId) ?? colors[0] ?? null;
  const hasRealColour = Boolean(selectedColor?.variantId);
  const price = product.salePrice ?? product.price;
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
    <>
      <div className="mt-3 min-h-8 hidden group-data-[layout=list]/catalog:block md:block">
        <ColorSwatches
          colors={colors}
          value={colorId || colors[0]?.variantId || null}
          onChange={setColorId}
          moreHref={product.colors.length > MAX_VISIBLE_SWATCHES ? `/products/${product.slug}` : undefined}
          showLabel={false}
        />
      </div>
      <div className="mt-3 flex items-center gap-2 md:mt-4">
        <div className="hidden md:block">
          <QuantityStepper size="sm" value={qty} onChange={setQty} min={1} max={Math.max(product.available, 1)} />
        </div>
        <button
          type="button"
          disabled={!canAdd}
          className={buttonClass("primary", "h-11 min-h-11 w-full min-w-0 flex-1 px-2 text-xs sm:px-3 sm:text-sm")}
          onClick={addLine}
        >
          {canAdd ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </>
  );
}
