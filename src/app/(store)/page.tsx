import Link from "next/link";
import { ProductRail } from "@/components/store/product-rail";
import { LogoMarquee } from "@/components/store/logo-marquee";
import { PromoDiscountedSection } from "@/components/store/promo-section";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { buttonClass } from "@/components/ui/button";
import { brandValues, editorialCollections, lifestyleBlocks } from "@/content/collections";
import { journalArticles } from "@/content/journal";
import { pageMeta } from "@/lib/seo";
import { mediaZoomClass } from "@/lib/utils";
import { listCategories, searchProducts } from "@/server/catalog/queries";
import { getStorefrontConfig } from "@/server/store/settings";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Kitchen appliances in Accra",
  description:
    "Kitchen appliances from the Accra shop, priced in Ghana Cedis.",
  path: "/",
});

export default async function HomePage() {
  const [config, categories, promo, featured, arrivals, catalogue] = await Promise.all([
    getStorefrontConfig(),
    listCategories(),
    searchProducts({ onSale: true, pageSize: 8 }),
    searchProducts({ featured: true, pageSize: 12 }),
    searchProducts({ isNew: true, pageSize: 12 }),
    searchProducts({ pageSize: 12 }),
  ]);
  const mix = featured.items.length > 0 ? featured.items : catalogue.items;
  const extraArrivals = arrivals.items.filter(
    (p) => !mix.some((f) => f.id === p.id) && !promo.items.some((sale) => sale.id === p.id),
  );
  const story = lifestyleBlocks[0];

  return (
    <div>
      <section className="overflow-hidden bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/demo/hero.jpg?v=2"
          alt="Kitchen utensils hung on a wall and arranged on a counter (layout photograph)"
          className="h-[min(85dvh,calc(100vw*710/735))] w-full object-cover object-[center_42%]"
        />
      </section>

      <h1 className="sr-only">Ashanti's Kitchenware, kitchen appliances in Accra</h1>

      <LogoMarquee />

      <section className="border-y border-border py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-5 text-center lg:px-8">
          <p className="text-xs uppercase tracking-[0.22em] text-accent">The Accra shop</p>
          <h2 className="mt-3 text-3xl md:text-5xl">{config.hero.title}</h2>
          {config.hero.subtitle ? (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-base">{config.hero.subtitle}</p>
          ) : null}
          {config.hero.ctaLabel ? (
            <Link href={config.hero.ctaHref || "/shop"} className={buttonClass("primary", "mt-6")}>
              {config.hero.ctaLabel}
            </Link>
          ) : null}
        </div>
        <ul className="mx-auto mt-10 grid max-w-6xl grid-cols-2 items-stretch gap-3 px-5 lg:grid-cols-3 lg:px-8">
          {categories.map((category) => (
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
                    className={`aspect-[4/5] h-full w-full object-cover sm:aspect-[5/4] md:aspect-auto md:h-64 ${mediaZoomClass}`}
                  />
                ) : (
                  <div className="aspect-[4/5] bg-background sm:aspect-[5/4] md:aspect-auto md:h-64" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5 md:p-6">
                  <h3 className="font-serif text-lg tracking-tight text-white sm:text-2xl md:text-3xl">{category.name}</h3>
                  {category.description ? (
                    <p className="mt-1 line-clamp-2 max-w-md text-[11px] text-white/85 sm:text-sm">{category.description}</p>
                  ) : null}
                  <span className="mt-2 inline-block text-xs font-medium tracking-wide sm:mt-3 sm:text-sm">
                    Shop this range →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PromoDiscountedSection products={promo.items} />

      {mix.length > 0 ? (
        <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl">In the shop</h2>
            <Link href="/products" className="text-sm tracking-wide text-accent">
              View all
            </Link>
          </div>
          <ProductRail products={mix} className="mt-10" />
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
          <h2 className="text-3xl">Catalogue</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Products appear here after staff publish them in the admin. Photographs can be added later.
          </p>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <h2 className="text-center text-3xl">Sets from the current catalogue</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          Editorial groupings, not discounted bundles. Add each piece on its own product page.
        </p>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {editorialCollections.map((collection) => (
            <li key={collection.title}>
              <Link href={collection.href} className="group block">
                <span className="block overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={collection.image} alt="" className={`aspect-[4/5] w-full object-cover ${mediaZoomClass}`} />
                </span>
                <h3 className="mt-4 font-serif text-2xl">{collection.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{collection.text}</p>
                <span className="mt-3 inline-block text-sm text-accent">Shop this range</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {story ? (
        <section className="grid md:grid-cols-2">
          <div className="overflow-hidden bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.image} alt="" className="h-full min-h-[320px] w-full object-cover md:min-h-[520px]" />
          </div>
          <div className="flex flex-col justify-center bg-accent px-6 py-14 text-white md:px-14">
            <p className="text-xs uppercase tracking-[0.22em] text-white/80">From the Accra shop</p>
            <h2 className="mt-4 text-3xl text-white md:text-4xl">{story.title}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90 md:text-base">{story.text}</p>
            <Link
              href={story.href}
              className={`${buttonClass("secondary", "mt-8 w-fit bg-white text-accent hover:bg-white/90")}`}
            >
              Shop appliances
            </Link>
          </div>
        </section>
      ) : null}

      <section className="px-5 py-16 md:py-20">
        <h2 className="text-center text-3xl">How we list stock</h2>
        <ul className="mx-auto mt-10 grid max-w-4xl gap-x-12 gap-y-8 sm:grid-cols-2">
          {brandValues.slice(0, 4).map((value) => (
            <li key={value.title}>
              <h3 className="font-serif text-xl">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {extraArrivals.length > 0 ? (
        <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <h2 className="text-3xl">New arrivals</h2>
          <ProductRail products={extraArrivals} className="mt-10" />
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl">Guides</h2>
          <Link href="/journal" className="text-sm text-accent">
            All guides
          </Link>
        </div>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {journalArticles.map((article) => (
            <li key={article.slug}>
              <Link href={`/journal/${article.slug}`} className="group block">
                <span className="block overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.image} alt={article.imageAlt} className={`h-52 w-full object-cover ${mediaZoomClass}`} />
                </span>
                <p className="mt-3 text-xs uppercase tracking-wide text-muted">
                  {article.category} · {article.minutes} min
                </p>
                <h3 className="mt-1 font-serif text-xl">{article.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-accent px-5 py-16 text-center text-white md:py-20">
        <h2 className="text-3xl text-white">New stock, when we have it.</h2>
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
    </div>
  );
}
