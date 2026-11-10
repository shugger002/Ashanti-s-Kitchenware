import Link from "next/link";
import { ProductRail } from "@/components/store/product-rail";
import { PromoDiscountedSection } from "@/components/store/promo-section";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { buttonClass } from "@/components/ui/button";
import { mediaZoomClass } from "@/lib/utils";
import { listCategories, searchProducts } from "@/server/catalog/queries";
import { getStorefrontConfig } from "@/server/store/settings";

export async function HomeIntroAndAisles() {
  const [config, categories] = await Promise.all([getStorefrontConfig(), listCategories()]);
  const aisles = categories.filter((category) => !category.parentId);

  return (
    <section className="border-y border-border py-8 md:py-16">
      <div className="mx-auto max-w-6xl px-4 text-center lg:px-8">
        <h2 className="text-2xl text-pretty md:text-5xl">{config.hero.title}</h2>
        {config.hero.subtitle ? (
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-base">{config.hero.subtitle}</p>
        ) : null}
        {config.hero.ctaLabel ? (
          <Link href={config.hero.ctaHref || "/products"} className={buttonClass("primary", "mt-6 h-12 w-full sm:w-auto")}>
            {config.hero.ctaLabel}
          </Link>
        ) : null}
      </div>
      <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-2 items-stretch gap-2.5 px-4 md:mt-10 md:gap-3 lg:grid-cols-3 lg:px-8 [&>li:last-child]:col-span-2 lg:[&>li:last-child]:col-span-1">
        {aisles.map((category) => (
          <li
            key={category.id}
            className="h-full"
            id={
              category.slug === "cookware"
                ? "cooking-ware"
                : category.slug === "storage-insulation"
                  ? "insulations"
                  : category.slug
            }
          >
            {category.slug === "cookware" ? <span id="cookware" className="sr-only" /> : null}
            {category.slug === "storage-insulation" ? <span id="storage-insulation" className="sr-only" /> : null}
            <Link href={`/shop/${category.slug}`} className="group relative block h-full overflow-hidden bg-surface">
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.imageUrl}
                  alt=""
                  className={`aspect-[4/3] h-full w-full object-cover sm:aspect-[5/4] md:aspect-auto md:h-64 ${mediaZoomClass}`}
                />
              ) : (
                <div className="aspect-[4/3] bg-background sm:aspect-[5/4] md:aspect-auto md:h-64" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5 text-white sm:p-5 md:p-6">
                <h3 className="font-serif text-sm leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
                  {category.name}
                </h3>
                {category.description ? (
                  <p className="mt-1 hidden line-clamp-2 max-w-md text-[11px] text-white/85 sm:block sm:text-sm">
                    {category.description}
                  </p>
                ) : null}
                <span className="mt-1.5 inline-block text-[11px] font-medium tracking-wide sm:mt-3 sm:text-sm">
                  Shop
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function HomeCatalog() {
  const [promo, featured, catalogue] = await Promise.all([
    searchProducts({ onSale: true, pageSize: 8 }),
    searchProducts({ featured: true, pageSize: 12 }),
    searchProducts({ pageSize: 16 }),
  ]);
  const mix = featured.items.length > 0 ? featured.items : catalogue.items;
  const shopMix = mix.filter((p) => !promo.items.some((sale) => sale.id === p.id));
  const shown = shopMix.length > 0 ? shopMix : mix;

  return (
    <>
      <PromoDiscountedSection products={promo.items} />
      {shown.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl md:text-3xl">In the shop</h2>
            <Link href="/products" className="min-h-11 py-2 text-sm tracking-wide text-accent">
              View all
            </Link>
          </div>
          <ProductRail products={shown} className="mt-6 md:mt-10" />
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 pb-10 lg:px-8 lg:pb-16">
          <h2 className="text-2xl md:text-3xl">Catalogue</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Products appear here after staff publish them in the admin. Photographs can be added later.
          </p>
        </section>
      )}
    </>
  );
}

export async function HomeArrivals() {
  const [promo, featured, catalogue, arrivals] = await Promise.all([
    searchProducts({ onSale: true, pageSize: 8 }),
    searchProducts({ featured: true, pageSize: 12 }),
    searchProducts({ pageSize: 16 }),
    searchProducts({ isNew: true, pageSize: 12 }),
  ]);
  const mix = featured.items.length > 0 ? featured.items : catalogue.items;
  const extraArrivals = arrivals.items.filter(
    (p) => !mix.some((f) => f.id === p.id) && !promo.items.some((sale) => sale.id === p.id),
  );
  if (extraArrivals.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-16">
      <h2 className="text-2xl md:text-3xl">New arrivals</h2>
      <ProductRail products={extraArrivals} className="mt-6 md:mt-10" />
    </section>
  );
}

export async function HomeNewsletter() {
  const config = await getStorefrontConfig();
  return (
    <section className="bg-accent px-4 py-10 text-center text-white md:px-5 md:py-20">
      <h2 className="text-2xl text-white md:text-3xl">New stock, when we have it.</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-white/90">
        Email updates for restocks and listed appliances. A first-order discount is offered only when the shop publishes one.
      </p>
      <div className="mx-auto mt-8 max-w-md text-left">
        <NewsletterForm invert />
      </div>
      <p className="mt-10 text-sm text-white/90">
        {[config.contact.addressLine1, config.contact.city].filter(Boolean).join(", ")}.{" "}
        <Link href="/contact" className="text-white underline underline-offset-2">
          Write to us
        </Link>
        .
      </p>
    </section>
  );
}
