import Link from "next/link";
import { ProductGrid } from "@/components/store/product-grid";
import { buttonClass } from "@/components/ui/button";
import { listCategories, searchProducts } from "@/server/catalog/queries";

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
}: {
  params: CatalogSearch;
  basePath: "/shop" | "/products";
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
  const title = params.q
    ? `Results for “${params.q}”`
    : params.sale === "1"
      ? "On promo"
      : params.featured === "1"
        ? "Featured"
        : params.new === "1"
          ? "New arrivals"
          : "Store";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12">
      <nav className="text-sm text-muted">
        <Link href="/">Home</Link> / <span>Store</span>
      </nav>
      <h1 className="mt-3 text-3xl md:mt-4 md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {params.sale === "1"
          ? "Pieces with a sale price staff entered below the regular Ghana Cedi price. Demo listings stay labelled and are not for sale."
          : "Priced in Ghana Cedis. Demo listings are labelled and are not for sale. Filter by what you can use this week."}
      </p>
      <p className="mt-2 text-sm text-muted">{total} products</p>
      <ul className="-mx-4 mt-6 flex flex-nowrap gap-2 overflow-x-auto px-4 text-sm [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <li key={c.id} id={c.slug}>
            {c.slug === "cookware" ? <span id="cooking-ware" className="sr-only" /> : null}
            {c.slug === "storage-insulation" ? <span id="insulations" className="sr-only" /> : null}
            <Link
              href={`/shop/${c.slug}`}
              className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-border bg-background px-3"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      <form className="mt-8 space-y-3" method="get" action={basePath}>
        {params.featured === "1" ? <input type="hidden" name="featured" value="1" /> : null}
        {params.new === "1" ? <input type="hidden" name="new" value="1" /> : null}
        {params.sale === "1" ? <input type="hidden" name="sale" value="1" /> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input name="q" defaultValue={params.q} placeholder="Search" className="input w-full sm:max-w-xs sm:flex-1" />
          <select name="category" defaultValue={params.category ?? ""} className="input w-full sm:max-w-48">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className="input w-full sm:max-w-48">
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <div className="flex items-center gap-3">
            <button className={buttonClass("primary", "w-full sm:w-auto")} type="submit">
              Apply
            </button>
            <Link href={basePath} className="text-sm text-muted">
              Reset
            </Link>
          </div>
        </div>
        <details className="rounded-2xl border border-border bg-surface p-4 text-sm" open={extraOpen || undefined}>
          <summary className="cursor-pointer font-medium">Price and availability</summary>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input name="min" defaultValue={params.min} placeholder="Min GHS" className="input max-w-32" />
            <input name="max" defaultValue={params.max} placeholder="Max GHS" className="input max-w-32" />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="stock" value="1" defaultChecked={params.stock === "1"} />
              In stock
            </label>
          </div>
        </details>
      </form>

      {items.length === 0 ? (
        <div className="mt-16">
          <p className="text-muted">We couldn’t find that. Featured pieces from the catalogue are below.</p>
          {popular.items.length > 0 ? (
            <div className="mt-8">
              <ProductGrid products={popular.items} />
            </div>
          ) : (
            <Link href={basePath} className="mt-4 inline-block text-sm text-accent">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <ProductGrid products={items} />
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-12 flex gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`${basePath}?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(n) }).toString()}`}
              className={`rounded-xl px-3 py-1.5 text-sm ${n === page ? "bg-accent text-white" : "bg-surface"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
