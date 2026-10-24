import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { adjustStock, listInventory, type InventoryRow } from "@/server/inventory/service";
import { revalidatePath } from "next/cache";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  EmptyState,
  MobileCards,
  StatusPill,
  Toolbar,
} from "@/components/admin/ui";
import { InventoryCsvForm } from "@/app/admin/inventory/csv-form";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function adjust(formData: FormData) {
  "use server";
  const user = await requirePermission("inventory.write");
  await adjustStock({
    inventoryId: String(formData.get("inventoryId")),
    deltaOnHand: Number(formData.get("delta")),
    reason: String(formData.get("reason") ?? "Adjustment"),
    notes: String(formData.get("notes") ?? ""),
    actorUserId: user.id,
  });
  revalidatePath("/admin/inventory");
}

async function restock(formData: FormData) {
  "use server";
  const user = await requirePermission("inventory.write");
  const qty = Math.max(0, Number(formData.get("qty")));
  if (qty <= 0) return;
  await adjustStock({
    inventoryId: String(formData.get("inventoryId")),
    deltaOnHand: qty,
    reason: "Restock",
    notes: String(formData.get("notes") ?? ""),
    actorUserId: user.id,
    source: "restock",
  });
  revalidatePath("/admin/inventory");
}

function isOut(row: InventoryRow) {
  return row.available <= 0;
}

function isLow(row: InventoryRow) {
  return row.available > 0 && row.available <= row.lowStockThreshold;
}

function isTight(row: InventoryRow) {
  return isOut(row) || isLow(row);
}

function RestockForm({ row, compact }: { row: InventoryRow; compact?: boolean }) {
  return (
    <form action={restock} className={cn("flex gap-2", compact ? "flex-wrap items-center" : "flex-col")}>
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
    <form action={adjust} className={cn("flex gap-2", compact ? "flex-wrap items-center" : "flex-col")}>
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

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; need?: string; product?: string }>;
}) {
  const params = await searchParams;
  const [, rows] = await Promise.all([requirePermission("inventory.write"), listInventory()]);
  const out = rows.filter(isOut).length;
  const low = rows.filter(isLow).length;
  const q = params.q?.trim().toLowerCase() ?? "";
  const need = params.need === "low" || params.need === "out" ? params.need : "";
  const productId = params.product?.trim() ?? "";

  let displayed = rows;
  if (productId) displayed = displayed.filter((row) => row.productId === productId);
  if (need === "low") displayed = displayed.filter(isLow);
  if (need === "out") displayed = displayed.filter(isOut);
  if (q) {
    displayed = displayed.filter(
      (row) => row.productName.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q),
    );
  }
  displayed = [...displayed].sort((a, b) => {
    const rank = (row: InventoryRow) => (isOut(row) ? 0 : isLow(row) ? 1 : 2);
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return a.productName.localeCompare(b.productName);
  });

  const filtered = Boolean(q || need || productId);
  const focusedName = productId ? rows.find((row) => row.productId === productId)?.productName : null;

  return (
    <div>
      <AdminPageHeader
        title="Stock"
        description="Low and finished pieces first. Restock what arrived. Fix a count only when the shelf does not match."
      />
      {rows.length > 0 ? (
        <AdminGlance
          items={[
            { href: "/admin/inventory", label: "Items", value: rows.length },
            { href: "/admin/inventory?need=low", label: "Low stock", value: low, warn: low > 0 },
            { href: "/admin/inventory?need=out", label: "Out of stock", value: out, warn: out > 0 },
          ]}
        />
      ) : null}

      {rows.length > 0 ? (
        <Toolbar>
          <form className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" method="get">
            {productId ? <input type="hidden" name="product" value={productId} /> : null}
            <label htmlFor="stock-q" className="sr-only">
              Search stock
            </label>
            <input
              id="stock-q"
              name="q"
              defaultValue={params.q}
              placeholder="Search name or code"
              className="input w-full sm:max-w-sm"
            />
            <select name="need" defaultValue={need} className="input w-full sm:max-w-48" aria-label="Stock that needs work">
              <option value="">All pieces</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
            <button className={adminButton()} type="submit">
              Filter
            </button>
            {filtered ? (
              <Link href="/admin/inventory" className="inline-flex h-12 items-center text-sm text-muted hover:text-foreground">
                Clear
              </Link>
            ) : null}
          </form>
        </Toolbar>
      ) : null}

      {focusedName ? (
        <p className="mt-4 text-sm text-muted">
          Showing {focusedName}.{" "}
          <Link href="/admin/inventory" className="text-accent">
            All stock
          </Link>
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing to count"
            body="Stock rows appear after you add a product."
            action={
              <Link href="/admin/products/new" className={adminButton()}>
                New product
              </Link>
            }
          />
        </div>
      ) : displayed.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing matched" body="Clear the filter or try another name or code." />
        </div>
      ) : (
        <>
          <MobileCards>
            {displayed.map((row) => {
              const tight = isTight(row);
              return (
                <li key={row.id} className={cn("admin-panel", tight && "warn")}>
                  <Link href={`/admin/products/${row.productId}`} className="flex items-start gap-3">
                    {row.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.imageUrl}
                        alt={row.imageAlt || row.productName}
                        className="h-14 w-14 shrink-0 object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-white text-[10px] text-muted">
                        No photo
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="font-medium">{row.productName}</span>
                      {row.variantName ? <span className="mt-0.5 block text-xs text-muted">{row.variantName}</span> : null}
                      <span className="mt-1 block text-xs text-muted">{row.sku}</span>
                      {tight ? (
                        <span className="mt-1 inline-block">
                          <StatusPill value={isOut(row) ? "Out" : "Low"} tone="attention" />
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  <p className={cn("mt-3 font-serif text-sm tabular-nums", tight && "font-medium text-accent")}>
                    {row.available} to sell · {row.onHand} on the shelf · {row.reserved} in unpaid orders
                  </p>
                  <div className="mt-3">
                    <RestockForm row={row} />
                  </div>
                  <details className="mt-3 border-t border-border pt-3">
                    <summary className="min-h-11 cursor-pointer text-sm text-muted">Fix the count</summary>
                    <div className="mt-2">
                      <AdjustForm row={row} />
                    </div>
                  </details>
                </li>
              );
            })}
          </MobileCards>
          <AdminTable className="mt-4">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">On the shelf</th>
                <th className="px-4 py-3 font-medium">In orders</th>
                <th className="px-4 py-3 font-medium">To sell</th>
                <th className="px-4 py-3 font-medium">Restock</th>
                <th className="px-4 py-3 font-medium">Fix count</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((row) => {
                const tight = isTight(row);
                return (
                  <tr
                    key={row.id}
                    className={cn("border-b border-border last:border-0 align-top", tight ? "bg-accent/5" : "hover:bg-surface")}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${row.productId}`} className="flex items-start gap-3">
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.imageUrl}
                            alt={row.imageAlt || row.productName}
                            className="h-14 w-14 shrink-0 object-cover"
                          />
                        ) : (
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-white text-[10px] text-muted">
                            No photo
                          </span>
                        )}
                        <span>
                          <span className="font-medium">{row.productName}</span>
                          {row.variantName ? <span className="mt-0.5 block text-xs text-muted">{row.variantName}</span> : null}
                          {tight ? (
                            <span className="mt-1 inline-block">
                              <StatusPill value={isOut(row) ? "Out" : "Low"} tone="attention" />
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{row.sku}</td>
                    <td className="px-4 py-3 font-serif tabular-nums">{row.onHand}</td>
                    <td className="px-4 py-3 font-serif tabular-nums">{row.reserved}</td>
                    <td className={cn("px-4 py-3 font-serif tabular-nums", tight && "font-medium text-accent")}>
                      {row.available}
                    </td>
                    <td className="px-4 py-3">
                      <RestockForm row={row} compact />
                    </td>
                    <td className="px-4 py-3">
                      <AdjustForm row={row} compact />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        </>
      )}

      {rows.length > 0 ? (
        <AdminSection className="mt-8" title="Restock from a file" hint="Need a code or product name column, plus how many arrived, or the new shelf count.">
          <InventoryCsvForm />
        </AdminSection>
      ) : null}
    </div>
  );
}
