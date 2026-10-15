"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { WishlistButton } from "@/components/store/wishlist-button";
import { pushToast } from "@/components/store/toast-store";
import type { ProductDetail } from "@/server/catalog/types";
import { isDemoListing } from "@/lib/listing";
import { colorsFromVariants } from "@/lib/product-color";
import { ColorSwatches } from "@/components/store/color-swatches";
import { QuantityStepper } from "@/components/store/quantity-stepper";

export function AddToCart({ product, sticky = false }: { product: ProductDetail; sticky?: boolean }) {
  const { add } = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const colors = colorsFromVariants(product.variants);
  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = useMemo(() => {
    if (variant?.priceOverride) return Number(variant.priceOverride);
    return Number(product.salePrice ?? product.price);
  }, [product, variant]);
  const available = variant ? variant.onHand - variant.reserved : product.available;
  const demo = isDemoListing(product.sku, product.slug);

  function addLine() {
    if (available < qty) {
      setMessage("That quantity is not available.");
      return false;
    }
    add(
      {
        productId: product.id,
        variantId,
        slug: product.slug,
        name: variant ? `${product.name}, ${variant.name}` : product.name,
        sku: variant?.sku ?? product.sku,
        unitPrice,
        imageUrl: product.primaryImage?.url ?? null,
      },
      qty,
    );
    pushToast(qty > 1 ? `Added ${qty} × ${product.name} to cart` : `Added ${product.name} to cart`);
    setMessage("Added to cart.");
    return true;
  }

  return (
    <form
      className={sticky ? "flex w-full shrink-0 items-center gap-2 sm:w-auto" : "space-y-4"}
      onSubmit={(event) => {
        event.preventDefault();
        addLine();
      }}
    >
      {product.variants.length > 0 && !sticky ? (
        colors.length > 1 ? (
          <ColorSwatches colors={colors} value={variantId} onChange={setVariantId} />
        ) : (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Options</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === variantId}
                  className={`rounded-sm border px-3 py-2 text-sm ${item.id === variantId ? "border-accent bg-background" : "border-border"}`}
                  onClick={() => setVariantId(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
        )
      ) : null}

      {sticky ? null : (
        <div className="flex items-center gap-3">
          <span className="text-sm">Quantity</span>
          <QuantityStepper size="sm" value={qty} onChange={setQty} min={1} max={Math.max(available, 1)} />
        </div>
      )}
      {sticky ? null : (
        <p className="text-sm text-muted">
          {available > 0 ? `${available} available` : "Out of stock"}
          {demo ? " · Demo photograph: confirm against stock before paying" : ""}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {sticky ? (
          <QuantityStepper size="sm" value={qty} onChange={setQty} min={1} max={Math.max(available, 1)} />
        ) : null}
        <Button type="submit" disabled={available <= 0}>
          Add to cart
        </Button>
        {sticky ? null : (
          <Button
            type="button"
            variant="secondary"
            className="hidden md:inline-flex"
            disabled={available <= 0}
            onClick={() => {
              if (addLine()) router.push("/cart");
            }}
          >
            Add and view cart
          </Button>
        )}
        {sticky ? null : (
          <WishlistButton
            item={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              unitPrice,
              imageUrl: product.primaryImage?.url ?? null,
            }}
          />
        )}
      </div>
      {message && !sticky ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
