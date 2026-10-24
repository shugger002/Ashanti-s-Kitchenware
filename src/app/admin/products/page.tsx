import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listAdminProducts } from "@/server/catalog/queries";
import { formatGhs } from "@/lib/money";
import { archiveProductAction } from "@/app/admin/products/actions";
import { ProductCsvForm } from "@/app/admin/products/csv-form";
import { adminButton, AdminGlance, AdminPageHeader, AdminTable, EmptyState, MobileCards, Toolbar } from "@/components/admin/ui";
import { hasPermission } from "@/server/auth/types";

const LOW_STOCK_ALERT = 5;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [user, items] = await Promise.all([
    requirePermission("products.read"),
    listAdminProducts(q),
  ]);
  const canWrite = hasPermission(user.roles, "products.write");
  const low = items.filter((p) => p.available > 0 && p.available <= LOW_STOCK_ALERT);
  const out = items.filter((p) => p.available <= 0);
  const onPromo = items.filter((p) => p.salePrice);

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Names, codes, prices in Cedis, and how many you have. Same as the container sheet."
        action={
          canWrite ? (
            <Link href="/admin/products/new" className={adminButton()}>
              Add product
            </Link>
          ) : undefined
        }
      />
      {items.length > 0 ? (
        <AdminGlance
          items={[
            { label: "Products", value: items.length },
            { href: "/admin/inventory?need=low", label: "Low stock", value: low.length, warn: low.length > 0 },
            { href: "/admin/inventory?need=out", label: "Out of stock", value: out.length, warn: out.length > 0 },
            { href: "/admin/promotions", label: "On promo", value: onPromo.length },
          ]}
        />
      ) : null}
      {canWrite ? (
        <div className="mt-6">
          <ProductCsvForm />
        </div>
      ) : null}
      <Toolbar>
        <form method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="product-q" className="sr-only">
            Search products
          </label>
          <input
            id="product-q"
            name="q"
            defaultValue={q}
            placeholder="Search name or code"
            className="input w-full sm:max-w-sm"
          />
          <button className={adminButton()} type="submit">
            Search
          </button>
        </form>
      </Toolbar>
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={q ? "Nothing matched" : "No products yet"}
            body={q ? "Try another name or code." : "Add a piece with a Ghana Cedi price. A photo can come later."}
            action={
              canWrite ? (
                <Link href="/admin/products/new" className={adminButton()}>
                  Add product
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
        <MobileCards>
          {items.map((p) => (
            <li key={p.id} className="admin-panel p-4">
              <Link href={`/admin/products/${p.id}`} className="block">
                <p className="font-medium">{p.name}</p>
                <p className="mt-0.5 text-xs uppercase text-muted">{p.categoryName ?? "No category"}</p>
                <p className="mt-1 text-xs text-muted">
                  {p.sku} · {p.available} to sell
                </p>
                <p className="mt-2 font-serif tabular-nums">
                  {p.salePrice ? (
                    <>
                      <span className="mr-2 text-muted line-through">{formatGhs(Number(p.price))}</span>
                      {formatGhs(Number(p.salePrice))}
                    </>
                  ) : (
                    formatGhs(Number(p.price))
                  )}
                </p>
              </Link>
              {canWrite ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Link href={`/admin/products/${p.id}`} className={adminButton()}>
                    Edit
                  </Link>
                  <form action={archiveProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="inline-flex h-12 w-full items-center justify-center text-sm text-accent">
                      Remove
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </MobileCards>
        <AdminTable className="mt-4">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">S/N</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">To sell</th>
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
                <td className="px-4 py-3 text-muted">{p.sku}</td>
                <td className="px-4 py-3 uppercase text-muted">{p.categoryName ?? "-"}</td>
                <td className="px-4 py-3 font-serif tabular-nums">
                  {p.salePrice ? (
                    <>
                      <span className="mr-2 text-muted line-through">{formatGhs(Number(p.price))}</span>
                      {formatGhs(Number(p.salePrice))}
                    </>
                  ) : (
                    formatGhs(Number(p.price))
                  )}
                </td>
                <td className={`px-4 py-3 font-serif tabular-nums ${p.available <= LOW_STOCK_ALERT ? "text-accent" : ""}`}>
                  {p.available}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Link href={`/admin/products/${p.id}`} className="inline-flex min-h-11 items-center text-muted hover:text-foreground">
                      Edit
                    </Link>
                    {canWrite ? (
                      <form action={archiveProductAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="inline-flex min-h-11 items-center text-accent">
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        </>
      )}
    </div>
  );
}
