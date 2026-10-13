import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { searchProducts } from "@/server/catalog/queries";
import { formatGhs } from "@/lib/money";
import { archiveProductAction } from "@/app/admin/products/actions";
import { ProductCsvForm } from "@/app/admin/products/csv-form";
import { adminButton, AdminPageHeader, AdminTable, EmptyState, Toolbar } from "@/components/admin/ui";
import { hasPermission } from "@/server/auth/types";

const LOW_STOCK_ALERT = 5;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requirePermission("products.read");
  const canWrite = hasPermission(user.roles, "products.write");
  const { q } = await searchParams;
  const { items } = await searchProducts({ q, includeInactive: true, pageSize: 50 });
  const low = items.filter((p) => p.available > 0 && p.available <= LOW_STOCK_ALERT);

  return (
    <div>
      {low.length > 0 ? (
        <div className="mb-6 rounded-xl border border-amber-700/60 bg-amber-950/40 p-4">
          <h2 className="text-sm font-medium text-amber-400">
            Low Stock Alert: {low.length} item{low.length === 1 ? "" : "s"} need restocking
          </h2>
          <p className="mt-1 text-xs text-amber-200/80">Threshold: ≤ {LOW_STOCK_ALERT} units</p>
          <ul className="mt-3 space-y-1 text-sm">
            {low.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <span>
                  {p.name}
                  <span className="ml-2 text-amber-200/70">{p.available} left</span>
                </span>
                <Link href="/admin/inventory" className="text-xs text-amber-200 underline">
                  Edit stock
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AdminPageHeader
        title="Admin Products Page"
        description="Manage your products here."
        action={
          <Link href="/admin/products/new" className={adminButton()}>
            Add Product
          </Link>
        }
      />
      {canWrite ? (
        <div className="mt-6">
          <ProductCsvForm />
        </div>
      ) : null}
      <Toolbar>
        <form method="get" className="flex min-w-0 flex-1">
          <label htmlFor="product-q" className="sr-only">
            Search products
          </label>
          <input
            id="product-q"
            name="q"
            defaultValue={q}
            placeholder="Search name or SKU"
            className="input max-w-sm"
          />
        </form>
      </Toolbar>
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={q ? "No matches" : "Catalogue is empty"}
            body={q ? "Try another name or SKU." : "Add a photographed piece with a Ghana Cedi price."}
            action={
              <Link href="/admin/products/new" className={adminButton()}>
                Add Product
              </Link>
            }
          />
        </div>
      ) : (
        <AdminTable className="mt-4">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">S/N</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, index) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3 tabular-nums text-muted">{index + 1}</td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                </td>
                <td className="px-4 py-3 uppercase text-muted">{p.categoryName ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">
                  {p.salePrice ? (
                    <>
                      <span className="mr-2 text-muted line-through">{formatGhs(Number(p.price))}</span>
                      {formatGhs(Number(p.salePrice))}
                    </>
                  ) : (
                    formatGhs(Number(p.price))
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Link href={`/admin/products/${p.id}`} className="text-muted hover:text-foreground">
                      Edit product
                    </Link>
                    <form action={archiveProductAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-accent">
                        Delete product
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
