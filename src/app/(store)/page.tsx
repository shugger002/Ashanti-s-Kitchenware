import Link from "next/link";
import { ProductGrid } from "@/components/store/product-grid";
import { LogoMarquee } from "@/components/store/logo-marquee";
import { PromoDiscountedSection } from "@/components/store/promo-section";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { buttonClass } from "@/components/ui/button";
import { brandValues } from "@/content/collections";
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
  const [config, categories, promo, catalogue] = await Promise.all([
    getStorefrontConfig(),
    listCategories(),
    searchProducts({ onSale: true, pageSize: 8 }),
    searchProducts({ pageSize: 24 }),
  ]);

  return (
    <div>
      <section className="overflow-hidden bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/demo/hero.jpg?v=2"
          alt="Kitchen utensils hung on a wall and arranged on a counter (layout photograph)"
          className="h-[min(52dvh,calc(100vw*710/735))] w-full object-cover object-[center_42%] md:h-[min(62dvh,calc(100vw*710/735))]"
        />
      </section>

      <h1 className="sr-only">Ashanti's Kitchenware, kitchen appliances in Accra</h1>

      <LogoMarquee />

      <section className="border-y border-border py-10 md:py-12">
        <div className="mx-auto max-w-6xl px-5 text-center lg:px-8">
          <p className="text-xs uppercase tracking-[0.22em] text-accent">The Accra shop</p>
          <h2 className="mt-3 text-3xl md:text-5xl">{config.hero.title}</h2>
          {config.hero.subtitle ? (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-base">{config.hero.subtitle}</p>
          ) : null}
          <Link href="/products" className={buttonClass("primary", "mt-6")}>
            {config.hero.ctaLabel || "Shop"}
          </Link>
        </div>
        <ul className="mx-auto mt-8 flex max-w-6xl flex-wrap justify-center gap-2 px-5 lg:px-8">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/shop/${category.slug}`}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PromoDiscountedSection products={promo.items} />

      {catalogue.items.length > 0 ? (
        <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl">Store</h2>
              <p className="mt-2 text-sm text-muted">{catalogue.total} products from the Accra shop.</p>
            </div>
            <Link href="/products" className="text-sm tracking-wide text-accent">
              View all
            </Link>
          </div>
          <div className="mt-10">
            <ProductGrid products={catalogue.items} />
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
          <h2 className="text-3xl">Store</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Products appear here after staff publish them in the admin. Photographs can be added later.
          </p>
        </section>
      )}

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
