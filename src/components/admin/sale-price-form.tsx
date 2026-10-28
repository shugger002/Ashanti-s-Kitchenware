"use client";

import { useMemo, useState } from "react";
import { applySalePriceAction } from "@/app/admin/promotions/actions";
import { adminButton } from "@/components/admin/ui";
import { formatGhs } from "@/lib/money";
import { cn } from "@/lib/utils";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function SalePriceForm({
  productId,
  name,
  price,
  salePrice,
  next,
  compact,
}: {
  productId: string;
  name: string;
  price: string;
  salePrice: string | null;
  next: string;
  compact?: boolean;
}) {
  const regular = Number(price);
  const [sale, setSale] = useState(salePrice ?? "");
  const saleNum = sale.trim() ? Number(sale) : NaN;
  const preview =
    Number.isFinite(saleNum) && saleNum > 0 && saleNum < regular ? roundMoney(saleNum) : null;
  const percentHint = preview ? Math.round((1 - preview / regular) * 100) : null;

  const summary = useMemo(() => {
    if (!preview) return `Regular ${formatGhs(regular)}. Leave empty or save with no sale to take it off.`;
    return `${formatGhs(regular)} → ${formatGhs(preview)}${percentHint ? ` (${percentHint}% off)` : ""}`;
  }, [preview, regular, percentHint]);

  return (
    <form action={applySalePriceAction} className={cn("flex flex-col gap-2", compact && "sm:flex-row sm:flex-wrap sm:items-end")}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="price" value={price} />
      <input type="hidden" name="next" value={next} />
      <label className="block min-w-0 flex-1 text-sm">
        Sale price (GH₵)
        <input
          name="salePrice"
          type="number"
          min="0.01"
          step="0.01"
          value={sale}
          onChange={(event) => setSale(event.target.value)}
          aria-label={`Sale price for ${name}`}
          className={cn("input mt-1", compact && "w-28")}
        />
      </label>
      <label className="block text-sm">
        Percent off
        <input
          name="discountPercent"
          type="number"
          min="1"
          max="99"
          step="1"
          placeholder="%"
          aria-label={`Percent off for ${name}`}
          className={cn("input mt-1", compact ? "w-20" : "")}
          onChange={(event) => {
            const percent = Number(event.target.value);
            if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return;
            setSale(String(roundMoney(regular * (1 - percent / 100))));
          }}
        />
      </label>
      <p className={cn("text-xs text-muted", compact && "w-full")}>{summary}</p>
      <div className={cn("flex flex-wrap gap-2", compact && "w-full")}>
        <button className={adminButton(compact ? "px-4" : undefined)} type="submit">
          Save sale
        </button>
        {salePrice ? (
          <button name="clear" value="1" className="inline-flex h-12 min-h-12 items-center text-sm text-muted" type="submit">
            Take off sale
          </button>
        ) : null}
      </div>
    </form>
  );
}
