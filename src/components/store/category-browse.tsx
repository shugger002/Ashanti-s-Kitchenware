import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { CategoryGlyph, categoryNavName } from "@/components/store/category-icon";
import { CategoryTabs } from "@/components/store/category-tabs";
import { ProductCardView } from "@/components/store/product-card";
import { ShopProductsSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listCategories, searchProducts } from "@/server/catalog/queries";
import type { Category, ProductCard } from "@/server/catalog/types";
import type { CatalogSearch } from "@/components/store/catalog-page";

type RailItem = {
  href: string;
  slug: string;
  name: string;
  active: boolean;
};

function viewFromParams(params: CatalogSearch) {
  if (params.new === "1") return "new" as const;
  if (params.featured === "1") return "featured" as const;
  if (params.sale === "1") return "sale" as const;
  if (params.stock === "1") return "stock" as const;
  return "all" as const;
}

function aisleHref(slug: string | null, view: ReturnType<typeof viewFromParams>) {
  const path = slug ? `/shop/${slug}` : "/shop";
  if (view === "all") return path;
  const query = new URLSearchParams();
  if (view === "new") query.set("new", "1");
  if (view === "featured") query.set("featured", "1");
  if (view === "sale") query.set("sale", "1");
  if (view === "stock") query.set("stock", "1");
  return `${path}?${query.toString()}`;
}

function railFor(
  categories: Category[],
  selected: Category | null,
  parent: Category | null,
  view: ReturnType<typeof viewFromParams>,
): RailItem[] {
  const children = parent
    ? categories.filter((c) => c.parentId === parent.id && (c.listedCount == null || c.listedCount > 0))
    : [];
  if (children.length > 0 && parent) {
    return [
      {
        href: `/shop/${parent.slug}`,
        slug: "all",
        name: `All ${categoryNavName(parent.slug, parent.name)}`,
        active: !selected || selected.id === parent.id,
      },
      ...children.map((child) => ({
        href: `/shop/${child.slug}`,
        slug: child.slug,
        name: child.name,
        active: selected?.id === child.id,
      })),
    ];
  }

  if (!selected) {
    return [
      { href: "/shop", slug: "all", name: "All", active: view === "all" },
      ...categories
        .filter((c) => !c.parentId)
        .map((c) => ({
          href: `/shop/${c.slug}`,
          slug: c.slug,
          name: categoryNavName(c.slug, c.name),
          active: false,
        })),
    ];
  }

  return [
    { href: aisleHref(selected.slug, "all"), slug: "all", name: `All ${categoryNavName(selected.slug, selected.name)}`, active: view === "all" },
    { href: aisleHref(selected.slug, "new"), slug: "new", name: "New", active: view === "new" },
    { href: aisleHref(selected.slug, "featured"), slug: "featured", name: "Featured", active: view === "featured" },
    { href: aisleHref(selected.slug, "sale"), slug: "sale", name: "Promo", active: view === "sale" },
    { href: aisleHref(selected.slug, "stock"), slug: "stock", name: "In stock", active: view === "stock" },
  ];
}

function bannerFor(category: Category | null, products: ProductCard[]) {
  if (category?.imageUrl) {
    return { src: category.imageUrl, alt: category.name };
  }
  const photo = products.find((p) => p.primaryImage?.url)?.primaryImage;
  if (photo?.url) {
    return { src: photo.url, alt: photo.alt || category?.name || "Kitchenware in this aisle" };
  }
  return null;
}

function headingFor(
  selected: Category | null,
  view: ReturnType<typeof viewFromParams>,
): { title: string; href: string } {
  if (!selected) {
    if (view === "new") return { title: "New arrivals", href: "/shop?new=1" };
    if (view === "featured") return { title: "Featured", href: "/shop?featured=1" };
    if (view === "sale") return { title: "On promo", href: "/shop?sale=1" };
    if (view === "stock") return { title: "In stock", href: "/shop?stock=1" };
    return { title: "All products", href: "/shop" };
  }
  if (view === "new") return { title: `New in ${selected.name}`, href: aisleHref(selected.slug, "new") };
  if (view === "featured") return { title: `Featured ${selected.name}`, href: aisleHref(selected.slug, "featured") };
  if (view === "sale") return { title: `${selected.name} on promo`, href: aisleHref(selected.slug, "sale") };
  if (view === "stock") return { title: `${selected.name} in stock`, href: aisleHref(selected.slug, "stock") };
  return { title: selected.name, href: `/shop/${selected.slug}` };
}

async function CategoryProducts({
  params,
  aisle,
  selected,
  view,
}: {
  params: CatalogSearch;
  aisle: Category | null;
  selected: Category | null;
  view: ReturnType<typeof viewFromParams>;
}) {
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const { items, total, pageSize } = await searchProducts({
    category: aisle?.slug,
    featured: view === "featured",
    isNew: view === "new",
    onSale: view === "sale",
    inStock: view === "stock",
    sort: view === "featured" ? "featured" : "newest",
    page,
    pageSize: 24,
  });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const banner = bannerFor(aisle, items);
  const heading = headingFor(selected, view);

  return (
    <>
      {banner ? (
        <div className="overflow-hidden rounded-sm bg-background" style={{ aspectRatio: "2.9 / 1" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.src} alt={banner.alt} className="size-full object-cover" />
        </div>
      ) : (
        <div className="rounded-sm bg-surface" style={{ aspectRatio: "2.9 / 1" }} aria-hidden />
      )}

      <section className="mt-3 md:mt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg tracking-tight md:text-xl">{heading.title}</h2>
          <Link href={heading.href} className="inline-flex size-9 items-center justify-center text-muted" aria-label={`See all ${heading.title}`}>
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="mt-6 text-pretty text-sm text-muted">Nothing in this aisle yet. Try another category.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3">
            {items.map((product, index) => (
              <li key={product.id}>
                <ProductCardView product={product} priority={index < 4} />
              </li>
            ))}
          </ul>
        )}

        {pages > 1 ? (
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
              const next = new URLSearchParams();
              if (params.new === "1") next.set("new", "1");
              if (params.featured === "1") next.set("featured", "1");
              if (params.sale === "1") next.set("sale", "1");
              if (params.stock === "1") next.set("stock", "1");
              next.set("page", String(n));
              const path = aisle ? `/shop/${aisle.slug}` : "/shop";
              return (
                <Link
                  key={n}
                  href={`${path}?${next.toString()}`}
                  className={cn(
                    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-3 text-sm",
                    n === page ? "bg-accent text-white" : "bg-background",
                  )}
                >
                  {n}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </section>
    </>
  );
}

export async function CategoryBrowse({ params }: { params: CatalogSearch }) {
  const view = viewFromParams(params);
  const categories = await listCategories();
  const tops = categories.filter((c) => !c.parentId);
  const selected = params.category ? (categories.find((c) => c.slug === params.category) ?? null) : null;
  const parent = selected?.parentId ? (categories.find((c) => c.id === selected.parentId) ?? selected) : selected;
  const aisle = selected ?? parent;
  const rail = railFor(categories, selected, parent, view);
  const heading = headingFor(selected, view);
  const tabs = [
    { href: "/shop", slug: "all", name: "All" },
    ...tops.map((c) => ({ href: `/shop/${c.slug}`, slug: c.slug, name: categoryNavName(c.slug, c.name) })),
  ];
  const activeTab = parent?.slug ?? selected?.slug ?? "all";

  return (
    <div className="pb-[calc(var(--store-dock)+0.75rem)] lg:pb-12">
      <h1 className="sr-only">{heading.title}</h1>
      <div className="sticky top-16 z-30 border-b border-border bg-background">
        <form action="/products" method="get" className="px-4 pt-3 md:mx-auto md:max-w-6xl md:px-8">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search products"
              enterKeyHint="search"
              autoComplete="off"
              className="input h-10 min-h-10 w-full appearance-none py-2 !pr-11 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:hidden"
            />
            <Search
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              strokeWidth={1.75}
            />
          </label>
        </form>
        <div className="md:mx-auto md:max-w-6xl md:px-8">
          <CategoryTabs tabs={tabs} activeSlug={activeTab} />
        </div>
      </div>

      <div className="flex md:mx-auto md:max-w-6xl md:gap-6 md:px-8 md:pt-4">
        <nav
          aria-label="Aisle"
          className="sticky top-[10.5rem] z-20 min-h-[calc(100dvh-10.5rem-var(--store-dock))] w-[15vw] min-w-16 max-w-[5.125rem] shrink-0 self-start bg-surface md:top-[11rem] md:min-h-[calc(100dvh-11rem)] md:w-52 md:max-w-none"
        >
          <ul className="flex max-h-[calc(100dvh-10.5rem-var(--store-dock))] flex-col overflow-y-auto py-1 md:max-h-[calc(100dvh-11rem)]">
            {rail.map((item) => (
              <li key={item.href + item.slug}>
                <Link
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  aria-label={item.name}
                  title={item.name}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-center transition-colors duration-200 md:min-h-12 md:flex-row md:justify-start md:gap-3 md:px-3",
                    item.active ? "bg-background text-accent" : "text-foreground",
                  )}
                >
                  {item.active ? (
                    <span className="absolute inset-y-2 left-0 w-0.5 bg-accent" aria-hidden />
                  ) : null}
                  <CategoryGlyph slug={item.slug} className="size-5 shrink-0 md:size-4" />
                  <span className="hidden whitespace-nowrap text-sm md:inline">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 px-3 py-3 md:px-0 md:py-0">
          <Suspense fallback={<ShopProductsSkeleton />}>
            <CategoryProducts params={params} aisle={aisle} selected={selected} view={view} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
