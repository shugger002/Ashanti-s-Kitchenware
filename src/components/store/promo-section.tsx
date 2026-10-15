import Link from "next/link";
import { ProductRail } from "@/components/store/product-rail";
import { buttonClass } from "@/components/ui/button";
import type { ProductCard } from "@/server/catalog/types";

export function splitSaleItems(items: ProductCard[]) {
  const featuredSale = items.filter((item) => item.isFeatured);
  const spotlight = featuredSale.length > 0 ? featuredSale : items.slice(0, 2);
  const ids = new Set(spotlight.map((item) => item.id));
  const discounted = items.filter((item) => !ids.has(item.id));
  return { spotlight, discounted };
}

function deepestCut(items: ProductCard[]) {
  return items.reduce((max, item) => {
    if (!item.salePrice || Number(item.price) <= 0) return max;
    const percent = Math.round((1 - Number(item.salePrice) / Number(item.price)) * 100);
    return percent > max ? percent : max;
  }, 0);
}

export function PromoDiscountedSection({
  products,
  variant = "home",
}: {
  products: ProductCard[];
  variant?: "home" | "page";
}) {
  const { spotlight, discounted } = splitSaleItems(products);
  const homeDiscounted = variant === "home" ? discounted.slice(0, 4) : discounted;
  const isPage = variant === "page";
  const cut = deepestCut(products);
  const count = products.length;

  if (products.length === 0) {
    if (!isPage) return null;
    return (
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-accent">Promo · Accra</p>
        <h1 className="mt-3 text-4xl md:text-5xl">Nothing on promo right now</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Pieces appear here when staff set a sale price below the regular Ghana Cedi amount. There is no store-wide
          percentage off unless a listing has that sale price.
        </p>
        <Link href="/products" className={`${buttonClass("primary")} mt-8`}>
          Browse the store
        </Link>
      </section>
    );
  }

  const Heading = isPage ? "h1" : "h2";

  return (
    <section id="promo" className={isPage ? "pb-20" : undefined}>
      <div className="bg-accent px-5 py-8 text-center text-white md:py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-white/80">Promo · Accra</p>
        <Heading className="mt-3 text-3xl text-white md:text-5xl">
          {cut > 0 ? `Up to ${cut}% off selected pieces` : "Sale prices, on the listing"}
        </Heading>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/90 md:text-base">
          {count} {count === 1 ? "piece has" : "pieces have"} a reduced Ghana Cedi price the shop actually entered.
          Not a blanket discount. Demo listings stay labelled.
        </p>
        {isPage ? (
          <Link
            href="/products"
            className={`${buttonClass("secondary", "mt-8 bg-white text-accent hover:bg-white/90")}`}
          >
            View all products
          </Link>
        ) : (
          <Link href="/promo" className={`${buttonClass("secondary", "mt-8 bg-white text-accent hover:bg-white/90")}`}>
            Shop every reduced price
          </Link>
        )}
      </div>

      <div className="bg-background px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {spotlight.length > 0 ? (
            <div id="promo-highlights">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-accent">On promo</p>
                  <h3 className="mt-1 font-serif text-2xl tracking-tight md:text-3xl">The pieces we put first</h3>
                </div>
              </div>
              <ProductRail products={spotlight} className="mt-8" />
            </div>
          ) : null}

          {homeDiscounted.length > 0 ? (
            <div id="discounted" className={spotlight.length > 0 ? "mt-14" : undefined}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-accent">Discounted</p>
                  <h3 className="mt-1 font-serif text-2xl tracking-tight md:text-3xl">More sale prices</h3>
                </div>
                {!isPage && discounted.length > homeDiscounted.length ? (
                  <Link href="/promo#discounted" className="text-sm text-accent">
                    See all discounted
                  </Link>
                ) : null}
              </div>
              <ProductRail products={homeDiscounted} className="mt-8" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
