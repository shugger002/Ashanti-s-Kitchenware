import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import {
  countStockGlance,
  isStockLow,
  isStockOut,
  listInventory,
  type InventoryRow,
} from "@/server/inventory/service";
import { StockListCard, StockTableRow } from "@/components/admin/stock-list-card";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  EmptyState,
  MobileCards,
  Toolbar,
} from "@/components/admin/ui";
import { InventoryCsvForm } from "@/app/admin/inventory/csv-form";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StockNeed = "work" | "low" | "out" | "all" | "demo";

function parseNeed(value?: string): StockNeed | "" {
  return value === "work" || value === "low" || value === "out" || value === "all" || value === "demo" ? value : "";
}

function listHref(opts: { q?: string; need?: string; product?: string }) {
  const params = new URLSearchParams();
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.need) params.set("need", opts.need);
  if (opts.product) params.set("product", opts.product);
  const query = params.toString();
  return query ? `/admin/inventory?${query}` : "/admin/inventory";
}

function matchesNeed(row: InventoryRow, need: StockNeed | undefined) {
  if (!need) return true;
  if (need === "all") return !row.isDemo;
  if (need === "demo") return row.isDemo;
  if (need === "low") return !row.isDemo && isStockLow(row);
  if (need === "out") return !row.isDemo && isStockOut(row);
  return !row.isDemo && (isStockLow(row) || isStockOut(row));
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; need?: string; product?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const searching = Boolean(q);
  const productId = params.product?.trim() ?? "";
  const needParam = parseNeed(params.need);
  const need: StockNeed | undefined = productId ? undefined : needParam || (searching ? undefined : "work");
  const [, rows, glance] = await Promise.all([
    requirePermission("inventory.write"),
    listInventory(),
    countStockGlance(),
  ]);

  let displayed = rows.filter((row) => matchesNeed(row, need));
  if (productId) displayed = displayed.filter((row) => row.productId === productId);
  if (q) {
    const needle = q.toLowerCase();
    displayed = displayed.filter(
      (row) => row.productName.toLowerCase().includes(needle) || row.sku.toLowerCase().includes(needle),
    );
  }
  displayed = [...displayed].sort((a, b) => {
    const rank = (row: InventoryRow) => (isStockOut(row) ? 0 : isStockLow(row) ? 1 : 2);
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return a.productName.localeCompare(b.productName);
  });

  const filtered = Boolean(searching || needParam || productId);
  const workNowActive = need === "work" && !searching && !productId;
  const chips: { href: string; label: string; active: boolean }[] = [
    { href: listHref({ q, need: "work" }), label: "Work now", active: workNowActive },
    { href: listHref({ q, need: "low" }), label: "Low", active: need === "low" },
    { href: listHref({ q, need: "out" }), label: "Out", active: need === "out" },
    { href: listHref({ q, need: "all" }), label: "All pieces", active: need === "all" },
    { href: listHref({ q, need: "demo" }), label: "Samples", active: need === "demo" },
  ];
  const focusedName = productId ? rows.find((row) => row.productId === productId)?.productName : null;

  return (
    <div>
      <AdminPageHeader
        title="Stock"
        description="Work now is low or finished shop pieces, not sample DEMO codes. Sold in shop takes a walk-in piece off the site. Restock what arrived. Fix a count only when the shelf does not match."
      />
      <AdminGlance
        items={[
          { href: "/admin/inventory", label: "Work now", value: glance.work, warn: glance.work > 0 },
          { href: "/admin/inventory?need=low", label: "Low stock", value: glance.low, warn: glance.low > 0 },
          { href: "/admin/inventory?need=out", label: "Out of stock", value: glance.out, warn: glance.out > 0 },
          { href: "/admin/inventory?need=all", label: "Items", value: glance.items },
        ]}
      />

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
            <select name="need" defaultValue={needParam || (searching ? "all" : need ?? "work")} className="input w-full sm:max-w-48" aria-label="Stock that needs work">
              <option value="work">Work now</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
              <option value="all">All pieces</option>
              <option value="demo">Samples</option>
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

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              buttonClass("ghost", "h-10 min-h-10 px-3 text-sm"),
              chip.active && "bg-foreground text-background hover:bg-foreground",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>

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
          <EmptyState
            title={filtered ? "Nothing matched" : "Nothing to restock"}
            body={filtered ? "Clear the filter or try another name or code." : "Low and finished pieces show here. Samples stay on the Samples chip."}
          />
        </div>
      ) : (
        <>
          <MobileCards>
            {displayed.map((row) => (
              <li key={row.id}>
                <StockListCard row={row} />
              </li>
            ))}
          </MobileCards>
          <AdminTable className="mt-4">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">On the shelf</th>
                <th className="px-4 py-3 font-medium">In orders</th>
                <th className="px-4 py-3 font-medium">To sell</th>
                <th className="px-4 py-3 font-medium">Shop and restock</th>
                <th className="px-4 py-3 font-medium">Piece</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((row) => (
                <StockTableRow key={row.id} row={row} />
              ))}
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
