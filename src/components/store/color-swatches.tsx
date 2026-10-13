"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MAX_VISIBLE_SWATCHES, type ProductColor } from "@/lib/product-color";
import { cn } from "@/lib/utils";

export function ColorSwatches({
  colors,
  value,
  onChange,
  moreHref,
  showLabel = true,
}: {
  colors: ProductColor[];
  value?: string | null;
  onChange?: (variantId: string) => void;
  moreHref?: string;
  showLabel?: boolean;
}) {
  if (colors.length === 0) return null;
  const visible = moreHref ? colors.slice(0, MAX_VISIBLE_SWATCHES) : colors;
  const extra = colors.length - visible.length;
  const selected = colors.find((color) => color.variantId === value);

  return (
    <div>
      {showLabel ? (
        selected ? (
          <p className="mb-2 text-sm">
            Colour: <span className="text-muted">{selected.name}</span>
          </p>
        ) : (
          <p className="mb-2 text-sm text-muted">{colors.length} colours</p>
        )
      ) : null}
      <div className="flex flex-wrap items-center gap-2" role="listbox" aria-label="Colour">
        {visible.map((color) => {
          const on = color.variantId === value;
          return (
            <button
              key={color.variantId || color.name}
              type="button"
              role="option"
              aria-selected={on}
              aria-label={color.name}
              title={color.name}
              className={cn(
                "h-8 w-8 shrink-0 rounded-full border border-black/15",
                on && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: color.hex }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange?.(color.variantId);
              }}
            />
          );
        })}
        {extra > 0 && moreHref ? (
          <Link
            href={moreHref}
            aria-label={`${extra} more colours`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted"
            onClick={(event) => event.stopPropagation()}
          >
            <ChevronDown className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
