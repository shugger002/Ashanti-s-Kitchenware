import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listAdminProducts, type AdminProductShopFilter } from "@/server/catalog/queries";
import { formatGhs } from "@/lib/money";
import { setProductActiveAction } from "@/app/admin/products/actions";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  MobileCards,
  StatusPill,
  Toolbar,
} from "@/components/admin/ui";
import { hasPermission } from "@/server/auth/types";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LOW_STOCK_ALERT = 5;

function parseShop(value?: string): AdminProductShopFilter | "" {
  return value === "on" || value === "hidden" || value === "nophoto" ? value : "";
}

function listHref(q?: string, shop?: string) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (shop) params.set("shop", shop);
  const query = params.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

function ProductPrice({ price, salePrice }: { price: string; salePrice: string | null }) {
  if (salePrice) {
    return (
      <>
        <span className="mr-2 text-muted line-through">{formatGhs(Number(price))}</span>
        {formatGhs(Number(salePrice))}
      </>
    );
  }
  return <>{formatGhs(Number(price))}</>;
}

function ProductThumb({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} className="size-14 shrink-0 object-cover" />
    );
  }
  return (
    <span className="flex size-14 shrink-0 items-center justify-center bg-surface text-center text-[10px] leading-tight text-muted">
      No photo
    </span>
  );
}

function ShopToggle({
  id,
  isActive,
  next,
}: {
  id: string;
  isActive: boolean;
  next: string;
}) {
  return (
    <form action={setProductActiveAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={isActive ? "false" : "true"} />
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="inline-flex min-h-11 items-center text-accent">
        {isActive ? "Hide" : "Show"}
      </button>
    </form>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shop?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  const shop = parseShop(params.shop);
  const [user, items, snapshot] = await Promise.all([
    requirePermission("products.read"),
    listAdminProducts({ q, shop: shop || undefined }),
    shop ? listAdminProducts({ q }) : Promise.resolve(null),
  ]);
  const canWrite = hasPermission(user.roles, "products.write");
  const counts = snapshot ?? items;
  const low = counts.filter((p) => p.available > 0 && p.available <= LOW_STOCK_ALERT);
  const out = counts.filter((p) => p.available <= 0);
  const onPromo = counts.filter((p) => p.salePrice);
  const hidden = counts.filter((p) => !p.isActive);
  const noPhoto = counts.filter((p) => !p.imageUrl);
  const onShop = counts.filter((p) => p.isActive);
  const next = listHref(q, shop);

  const chips: { href: string; label: string; active: boolean }[] = [
    { href: listHref(q), label: "All", active: !shop },
    { href: listHref(q, "on"), label: "On the shop", active: shop === "on" },
    { href: listHref(q, "hidden"), label: "Hidden", active: shop === "hidden" },
    { href: listHref(q, "nophoto"), label: "No photo", active: shop === "nophoto" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Edit products"
        description="Open a piece to change its name, price, photos, or stock. You do not add it again."
        action={
          canWrite ? (
            <Link href="/admin/products/new" className={adminButton()}>
              Add product
            </Link>
          ) : undefined
        }
      />
      {canWrite ? (
        <p className="mt-4 text-sm text-muted">
          To load many pieces from a CSV, Excel file, or PDF, open{" "}
          <Link href="/admin/products/new#add-many" className="text-accent">
            Add product
          </Link>
          .
        </p>
      ) : null}
      {counts.length > 0 ? (
        <AdminGlance
          items={[
            { href: "/admin/products", label: "Products", value: counts.length },
            { href: listHref(undefined, "on"), label: "On the shop", value: onShop.length },
            { href: listHref(undefined, "hidden"), label: "Hidden", value: hidden.length, warn: hidden.length > 0 },
            { href: listHref(undefined, "nophoto"), label: "No photo", value: noPhoto.length, warn: noPhoto.length > 0 },
            { href: "/admin/inventory?need=low", label: "Low stock", value: low.length, warn: low.length > 0 },
            { href: "/admin/inventory?need=out", label: "Out of stock", value: out.length, warn: out.length > 0 },
            { href: "/admin/promotions", label: "On promo", value: onPromo.length },
          ]}
        />
      ) : null}
      <Toolbar>
        <form method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {shop ? <input type="hidden" name="shop" value={shop} /> : null}
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
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={q || shop ? "Nothing matched" : "No products yet"}
            body={
              q || shop
                ? "Try another name, code, or filter."
                : "Add a piece with a Ghana Cedi price. A photo can come later."
            }
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
                <Link href={`/admin/products/${p.id}`} className="flex gap-3">
                  <ProductThumb name={p.name} imageUrl={p.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {p.sku} · {p.available} to sell
                    </p>
                    <p className="mt-2 font-serif tabular-nums">
                      <ProductPrice price={p.price} salePrice={p.salePrice} />
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <StatusPill value={p.isActive ? "On the shop" : "Hidden"} tone={p.isActive ? "ok" : "muted"} />
                      {p.isFeatured ? <StatusPill value="Homepage" tone="attention" /> : null}
                    </div>
                  </div>
                </Link>
                {canWrite ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Link href={`/admin/products/${p.id}`} className={adminButton()}>
                      Edit this piece
                    </Link>
                    <ShopToggle id={p.id} isActive={p.isActive} next={next} />
                    {p.isActive ? (
                      <Link href={`/products/${p.slug}`} className="inline-flex h-12 min-h-12 items-center justify-center text-sm text-muted hover:text-foreground">
                        View on shop
                      </Link>
                    ) : null}
                  </div>
                ) : p.isActive ? (
                  <Link href={`/products/${p.slug}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-muted">
                    View on shop
                  </Link>
                ) : null}
              </li>
            ))}
          </MobileCards>
          <AdminTable className="mt-4">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">To sell</th>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-4 py-3">
                    <ProductThumb name={p.name} imageUrl={p.imageUrl} />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.sku}</td>
                  <td className="px-4 py-3 font-serif tabular-nums">
                    <ProductPrice price={p.price} salePrice={p.salePrice} />
                  </td>
                  <td className={`px-4 py-3 font-serif tabular-nums ${p.available <= LOW_STOCK_ALERT ? "text-accent" : ""}`}>
                    {p.available}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={p.isActive ? "On the shop" : "Hidden"} tone={p.isActive ? "ok" : "muted"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Link href={`/admin/products/${p.id}`} className={adminButton("h-11 min-h-11 px-4")}>
                        Edit this piece
                      </Link>
                      {canWrite ? <ShopToggle id={p.id} isActive={p.isActive} next={next} /> : null}
                      {p.isActive ? (
                        <Link href={`/products/${p.slug}`} className="inline-flex min-h-11 items-center text-muted hover:text-foreground">
                          View on shop
                        </Link>
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
