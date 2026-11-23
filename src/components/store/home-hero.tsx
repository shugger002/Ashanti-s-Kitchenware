import { HeroSlideshow, type HeroSlide } from "@/components/store/hero-slideshow";
import { isDemoListing } from "@/lib/listing";
import { searchProducts } from "@/server/catalog/queries";
import type { ProductCard } from "@/server/catalog/types";

function discountOf(product: ProductCard) {
  if (!product.salePrice || Number(product.price) <= 0) return 0;
  const cut = Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100);
  return cut > 0 ? cut : 0;
}

function toSlide(product: ProductCard): HeroSlide | null {
  const imageUrl = product.primaryImage?.url;
  if (!imageUrl || isDemoListing(product.sku, product.slug) || product.available <= 0) return null;
  return {
    slug: product.slug,
    name: product.name,
    imageUrl,
    imageAlt: product.primaryImage?.alt || product.name,
    price: product.price,
    salePrice: discountOf(product) > 0 ? product.salePrice : null,
    discount: discountOf(product),
  };
}

export async function HomeHero() {
  const [sale, featured] = await Promise.all([
    searchProducts({ onSale: true, inStock: true, pageSize: 8 }),
    searchProducts({ inStock: true, sort: "featured", pageSize: 8 }),
  ]);
  const chosen: ProductCard[] = [];
  const seen = new Set<string>();
  for (const product of [...sale.items, ...featured.items]) {
    if (seen.has(product.id)) continue;
    if (!toSlide(product)) continue;
    seen.add(product.id);
    chosen.push(product);
    if (chosen.length >= 6) break;
  }
  const promoFirst = [...chosen.filter((product) => discountOf(product) > 0), ...chosen.filter((product) => discountOf(product) === 0)];
  const slides = promoFirst.map(toSlide).filter((slide): slide is HeroSlide => slide !== null);

  if (slides.length === 0) {
    return (
      <section className="relative overflow-hidden bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/demo/hero.jpg?v=2"
          alt="Kitchen utensils hung on a wall and arranged on a counter"
          width={1470}
          height={1420}
          fetchPriority="high"
          decoding="async"
          className="h-[min(42dvh,18rem)] w-full object-cover object-[center_42%] md:h-[min(85dvh,calc(100vw*710/735))]"
        />
      </section>
    );
  }

  return <HeroSlideshow slides={slides} />;
}
