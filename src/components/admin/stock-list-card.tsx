import Link from "next/link";
import { adjustStockAction, restockAction, soldInShopAction } from "@/app/admin/inventory/actions";
import { adminButton, StatusPill } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isStockOut, isStockTight, type InventoryRow } from "@/server/inventory/service";

function SoldInShopForm({ row, compact }: { row: InventoryRow; compact?: boolean }) {
  if (row.isDemo) return null;
  if (row.available <= 0) {
    return compact ? null : <p className="text-sm text-muted">Nothing on the shelf to mark sold.</p>;
  }
  return (
    <form action={soldInShopAction} className={cn("flex gap-2", compact ? "flex-wrap items-center" : "flex-col")}>
      <input type="hidden" name="inventoryId" value={row.id} />
      <input
        name="qty"
        type="number"
        min={1}
        max={row.available}
        defaultValue={1}
        required
        placeholder={compact ? "Qty" : "How many walked out"}
        aria-label={`Sold in shop, ${row.productName}`}
        className={cn("input", compact && "w-16")}
      />
      <button className={adminButton(compact ? "px-3 py-2" : undefined)} type="submit">
        Sold in shop
      </button>
    </form>
  );
}

function RestockForm({ row, compact }: { row: InventoryRow; compact?: boolean }) {
  return (
    <form action={restockAction} className={cn("flex gap-2", compact ? "flex-wrap items-center" : "flex-col")}>
      <input type="hidden" name="inventoryId" value={row.id} />
      <input
        name="qty"
        type="number"
        min={1}
        required
        placeholder={compact ? "Arrived" : "How many arrived"}
        aria-label={`Restock ${row.productName}`}
        className={cn("input", compact && "w-20")}
      />
      <button className={adminButton(compact ? "px-3 py-2" : undefined)} type="submit">
        Restock
      </button>
    </form>
  );
}

function AdjustForm({ row, compact }: { row: InventoryRow; compact?: boolean }) {
  return (
    <form action={adjustStockAction} className={cn("flex gap-2", compact ? "flex-wrap items-center" : "flex-col")}>
      <input type="hidden" name="inventoryId" value={row.id} />
      <input
        name="delta"
        type="number"
        required
        placeholder={compact ? "Fix count" : "Fix the count (+ or −)"}
        aria-label={`Adjust ${row.productName}`}
        className={cn("input", compact && "w-24")}
      />
      <input
        name="reason"
        required
        placeholder={compact ? "Why" : "Why, like breakage or recount"}
        aria-label={`Reason for ${row.productName}`}
        className={cn("input", compact && "min-w-40 flex-1")}
      />
      <button className={buttonClass("secondary", compact ? "h-12 min-h-12 px-3 py-2" : "h-12 min-h-12 w-full sm:w-auto")} type="submit">
        Save count
      </button>
    </form>
  );
}

function StockThumb({ row }: { row: InventoryRow }) {
  if (row.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={row.imageUrl} alt={row.imageAlt || row.productName} className="h-14 w-14 shrink-0 object-cover" />
    );
  }
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-white text-[10px] text-muted">
      No photo
    </span>
  );
}

export function StockListCard({ row }: { row: InventoryRow }) {
  const tight = isStockTight(row);
  const out = isStockOut(row);
  return (
    <article className={cn("admin-panel space-y-4", tight && "warn")}>
      <div className="flex items-start gap-3">
        <StockThumb row={row} />
        <div className="min-w-0">
          <p className="font-medium">{row.productName}</p>
          {row.variantName ? <p className="mt-0.5 text-xs text-muted">{row.variantName}</p> : null}
          <p className="mt-1 text-xs text-muted">{row.sku}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {tight ? <StatusPill value={out ? "Out" : "Low"} tone="attention" /> : null}
            {row.isDemo ? <StatusPill value="Sample" tone="muted" /> : null}
            {!row.isActive ? <StatusPill value="Hidden" tone="muted" /> : null}
          </div>
        </div>
      </div>
      <p className={cn("font-serif text-sm tabular-nums", tight && "font-medium text-accent")}>
        {row.available} to sell · {row.onHand} on the shelf · {row.reserved} in unpaid orders
      </p>
      <SoldInShopForm row={row} />
      <RestockForm row={row} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href={`/admin/products/${row.productId}`} className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
          Open this piece
        </Link>
      </div>
      <details className="border-t border-border pt-3">
        <summary className="min-h-11 cursor-pointer text-sm text-muted">Fix the count</summary>
        <div className="mt-2">
          <AdjustForm row={row} />
        </div>
      </details>
    </article>
  );
}

export function StockTableRow({ row }: { row: InventoryRow }) {
  const tight = isStockTight(row);
  const out = isStockOut(row);
  return (
    <tr className={cn("border-b border-border last:border-0 align-top", tight ? "bg-accent/5" : "hover:bg-surface")}>
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <StockThumb row={row} />
          <span>
            <span className="font-medium">{row.productName}</span>
            {row.variantName ? <span className="mt-0.5 block text-xs text-muted">{row.variantName}</span> : null}
            <span className="mt-1 flex flex-wrap gap-1">
              {tight ? <StatusPill value={out ? "Out" : "Low"} tone="attention" /> : null}
              {row.isDemo ? <StatusPill value="Sample" tone="muted" /> : null}
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted">{row.sku}</td>
      <td className="px-4 py-3 font-serif tabular-nums">{row.onHand}</td>
      <td className="px-4 py-3 font-serif tabular-nums">{row.reserved}</td>
      <td className={cn("px-4 py-3 font-serif tabular-nums", tight && "font-medium text-accent")}>{row.available}</td>
      <td className="px-4 py-3">
        <SoldInShopForm row={row} compact />
        <div className="mt-2">
          <RestockForm row={row} compact />
        </div>
      </td>
      <td className="px-4 py-3">
        <Link href={`/admin/products/${row.productId}`} className={buttonClass("secondary", "h-11 min-h-11 px-4")}>
          Open this piece
        </Link>
        <details className="mt-2">
          <summary className="min-h-11 cursor-pointer text-sm text-muted">Fix the count</summary>
          <div className="mt-2">
            <AdjustForm row={row} compact />
          </div>
        </details>
      </td>
    </tr>
  );
}
