import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { searchProducts } from "@/server/catalog/queries";
import { formatGhs } from "@/lib/money";
import { adminButton, AdminPageHeader, AdminTable, EmptyState, StatusPill, Toolbar } from "@/components/admin/ui";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("products.read");
  const { q } = await searchParams;
  const { items } = await searchProducts({ q, includeInactive: true, pageSize: 50 });
  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Photograph, price, and publish what is actually on the shelf."
        action={
          <Link href="/admin/products/new" className={adminButton()}>
            New product
          </Link>
        }
      />
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
            body={
              q
                ? "Try another name or SKU."
                : "Add a photographed piece with a Ghana Cedi price before listing it in the shop."
            }
            action={
              <Link href="/admin/products/new" className={adminButton()}>
                New product
              </Link>
            }
          />
        </div>
      ) : (
        <AdminTable className="mt-4">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    {p.primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.primaryImage.url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface text-[10px] text-muted">
                        No photo
                      </span>
                    )}
                    <span>
                      <span className="block font-medium">{p.name}</span>
                      {p.categoryName ? <span className="text-xs text-muted">{p.categoryName}</span> : null}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{p.sku}</td>
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
                <td className={`px-4 py-3 tabular-nums ${p.available <= 0 ? "text-accent" : ""}`}>{p.available}</td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    <StatusPill value={p.isActive ? "Listed" : "Hidden"} tone={p.isActive ? "ok" : "muted"} />
                    {p.isFeatured ? <StatusPill value="Featured" tone="attention" /> : null}
                    {p.isNew ? <StatusPill value="New" /> : null}
                    {p.salePrice ? <StatusPill value="Promo" tone="attention" /> : null}
                    {p.sku.toUpperCase().startsWith("DEMO") ? (
                      <StatusPill value="Demo" tone="attention" />
                    ) : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
