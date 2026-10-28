import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listAdminProducts } from "@/server/catalog/queries";
import { formatGhs } from "@/lib/money";
import { SalePriceForm } from "@/components/admin/sale-price-form";
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
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function onPromo(price: string, salePrice: string | null) {
  return Boolean(salePrice && Number(salePrice) > 0 && Number(salePrice) < Number(price));
}

function listHref(q?: string, sale?: string) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (sale) params.set("sale", sale);
  const query = params.toString();
  return query ? `/admin/promotions?${query}` : "/admin/promotions";
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

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sale?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  const sale = params.sale === "on" || params.sale === "off" || params.sale === "all" ? params.sale : "";
  const [, items] = await Promise.all([requirePermission("products.write"), listAdminProducts({ q })]);
  const promoAll = items.filter((p) => onPromo(p.price, p.salePrice));
  const onShop = items.filter((p) => p.isActive);
  const searching = Boolean(q?.trim());
  const pool = searching ? items : onShop;

  let displayed = pool;
  if (sale === "on") displayed = pool.filter((p) => onPromo(p.price, p.salePrice));
  else if (sale === "off") displayed = pool.filter((p) => !onPromo(p.price, p.salePrice));
  else if (sale === "all") displayed = pool;
  else if (!searching && promoAll.some((p) => p.isActive)) {
    displayed = pool.filter((p) => onPromo(p.price, p.salePrice));
  }

  const next = listHref(q, sale);
  const showingPromoDefault = !sale && !searching && promoAll.some((p) => p.isActive);
  const chips: { href: string; label: string; active: boolean }[] = [
    { href: listHref(q, "on"), label: "On promo", active: sale === "on" || showingPromoDefault },
    { href: listHref(q, "off"), label: "Not on sale", active: sale === "off" },
    { href: listHref(q, "all"), label: "On the shop", active: sale === "all" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Discounts"
        description="Put a Ghana Cedi sale price on a piece. That is not a coupon. Delivery stays on WhatsApp."
        action={
          <Link href="/admin/coupons" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
            Coupons
          </Link>
        }
      />
      <p className="mt-4 max-w-xl text-sm text-muted">
        Checkout codes live on{" "}
        <Link href="/admin/coupons" className="text-accent">
          Coupons
        </Link>
        . Shoppers see sale prices on{" "}
        <Link href="/promo" className="text-accent">
          Promo
        </Link>
        .
      </p>
      {items.length > 0 ? (
        <AdminGlance
          items={[
            { href: listHref(undefined, "on"), label: "On promo", value: promoAll.length, warn: false },
            { href: listHref(undefined, "all"), label: "On the shop", value: onShop.length },
          ]}
        />
      ) : null}
      <Toolbar>
        <form method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          {sale ? <input type="hidden" name="sale" value={sale} /> : null}
          <label htmlFor="promo-q" className="sr-only">
            Search products
          </label>
          <input
            id="promo-q"
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
            title="No products yet"
            body="Add a product first, then you can put it on sale."
            action={
              <Link href="/admin/products/new" className={adminButton()}>
                Add product
              </Link>
            }
          />
        </div>
      ) : displayed.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing matched" body="Try another name, code, or filter." />
        </div>
      ) : (
        <>
          <MobileCards className="mt-6">
            {displayed.map((p) => {
              const promo = onPromo(p.price, p.salePrice);
              return (
                <li key={p.id} className="admin-panel p-4">
                  <div className="flex gap-3">
                    <ProductThumb name={p.name} imageUrl={p.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${p.id}`} className="font-medium">
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">{p.sku}</p>
                      <p className="mt-2 font-serif tabular-nums">
                        {promo ? (
                          <>
                            <span className="mr-2 text-muted line-through">{formatGhs(Number(p.price))}</span>
                            {formatGhs(Number(p.salePrice))}
                          </>
                        ) : (
                          formatGhs(Number(p.price))
                        )}
                      </p>
                      <div className="mt-2">
                        <StatusPill value={promo ? "On promo" : "No sale"} tone={promo ? "ok" : "muted"} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <SalePriceForm
                      productId={p.id}
                      name={p.name}
                      price={p.price}
                      salePrice={p.salePrice}
                      next={next}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 text-sm">
                    <Link href={`/admin/products/${p.id}`} className="inline-flex min-h-11 items-center text-muted">
                      Edit this piece
                    </Link>
                    {promo ? (
                      <Link href="/promo" className="inline-flex min-h-11 items-center text-muted">
                        View promo page
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </MobileCards>
          <AdminTable className="mt-6">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Sale</th>
                <th className="px-4 py-3 font-medium">Set sale</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((p) => {
                const promo = onPromo(p.price, p.salePrice);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3">
                      <ProductThumb name={p.name} imageUrl={p.imageUrl} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}`} className="font-medium">
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">{p.sku}</p>
                      <div className="mt-2">
                        <StatusPill value={promo ? "On promo" : "No sale"} tone={promo ? "ok" : "muted"} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-serif tabular-nums">{formatGhs(Number(p.price))}</td>
                    <td className="px-4 py-3 font-serif tabular-nums">
                      {promo ? formatGhs(Number(p.salePrice)) : "No sale"}
                    </td>
                    <td className="px-4 py-3">
                      <SalePriceForm
                        productId={p.id}
                        name={p.name}
                        price={p.price}
                        salePrice={p.salePrice}
                        next={next}
                        compact
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        </>
      )}
    </div>
  );
}
