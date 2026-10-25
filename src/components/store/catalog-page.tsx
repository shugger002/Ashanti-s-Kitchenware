import Link from "next/link";
import { ProductGrid } from "@/components/store/product-grid";
import { CatalogToolbar } from "@/components/store/catalog-toolbar";
import { listCategories, searchProducts } from "@/server/catalog/queries";
import { cn } from "@/lib/utils";

export type CatalogSearch = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  stock?: string;
  sort?: string;
  page?: string;
  featured?: string;
  new?: string;
  sale?: string;
};

export async function CatalogPage({
  params,
  basePath,
  heading,
}: {
  params: CatalogSearch;
  basePath: "/shop" | "/products";
  heading?: string;
}) {
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const sort =
    params.sort === "price_asc" || params.sort === "price_desc" || params.sort === "newest" || params.sort === "featured"
      ? params.sort
      : params.featured === "1"
        ? "featured"
        : "newest";
  const extraOpen = Boolean(params.min || params.max || params.stock);
  const [{ items, total, pageSize }, categories, popular] = await Promise.all([
    searchProducts({
      q: params.q?.trim() || undefined,
      category: params.category || undefined,
      minPrice: params.min ? Number(params.min) : undefined,
      maxPrice: params.max ? Number(params.max) : undefined,
      inStock: params.stock === "1",
      featured: params.featured === "1",
      isNew: params.new === "1",
      onSale: params.sale === "1",
      sort,
      page,
    }),
    listCategories(),
    searchProducts({ featured: true, pageSize: 4 }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const title = heading
    ? heading
    : params.q
      ? `Results for “${params.q}”`
      : params.sale === "1"
        ? "On promo"
        : params.featured === "1"
          ? "Featured"
          : params.new === "1"
            ? "New arrivals"
            : "Store";

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 pb-24 lg:px-8 lg:py-10 lg:pb-12">
      <nav className="hidden text-sm text-muted md:block">
        <Link href="/">Home</Link>
        {" / "}
        <Link href="/shop">Store</Link>
        {heading ? (
          <>
            {" / "}
            <span>{heading}</span>
          </>
        ) : null}
      </nav>
      <div className="flex items-baseline justify-between gap-3 md:mt-3">
        <h1 className="text-pretty text-2xl md:text-4xl">{title}</h1>
        {items.length > 0 ? (
          <p className="shrink-0 text-sm tabular-nums text-muted">{total} pieces</p>
        ) : null}
      </div>
      {params.sale === "1" ? (
        <p className="mt-2 max-w-2xl text-pretty text-sm text-muted">
          Pieces with a sale price staff entered below the regular Ghana Cedi price.
        </p>
      ) : null}

      <CatalogToolbar
        params={params}
        sort={sort}
        extraOpen={extraOpen}
        basePath={basePath}
        category={params.category}
      />

      <ul className="-mx-4 mt-2 flex flex-nowrap gap-2 overflow-x-auto px-4 text-sm touch-manipulation [scrollbar-width:none] md:mx-0 md:mt-3 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <li>
          <Link
            href="/shop"
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-3",
              params.category
                ? "border-border bg-background"
                : "border-accent bg-accent text-white",
            )}
          >
            All
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id} id={c.slug}>
            {c.slug === "cookware" ? <span id="cooking-ware" className="sr-only" /> : null}
            {c.slug === "storage-insulation" ? <span id="insulations" className="sr-only" /> : null}
            <Link
              href={`/shop/${c.slug}`}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-3",
                params.category === c.slug
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-background",
              )}
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <div className="mt-8">
          <p className="text-pretty text-muted">Nothing matched. Featured pieces from the catalogue are below.</p>
          {popular.items.length > 0 ? (
            <div className="mt-6">
              <ProductGrid products={popular.items} countLabel={`${popular.items.length} featured`} />
            </div>
          ) : (
            <Link href={basePath} className="mt-4 inline-block min-h-11 text-sm text-accent">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <ProductGrid products={items} />
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`${basePath}?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(n) }).toString()}`}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm ${n === page ? "bg-accent text-white" : "bg-surface"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
