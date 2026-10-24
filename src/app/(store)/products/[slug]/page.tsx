import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/store/add-to-cart";
import { ProductRail } from "@/components/store/product-rail";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductReviews } from "@/components/store/product-reviews";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { TrackViewed } from "@/components/store/track-viewed";
import { formatGhs } from "@/lib/money";
import { jsonLdText, pageMeta } from "@/lib/seo";
import { getAppUrl } from "@/server/env";
import { getProductBySlug, relatedProducts } from "@/server/catalog/queries";
import { listPublishedReviews } from "@/server/reviews/service";
import { isDemoListing } from "@/lib/listing";
import { StarRating } from "@/components/store/star-rating";
import { SalePriceBubble } from "@/components/store/sale-price";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return pageMeta({ title: "Product", description: "Product not found", path: `/products/${slug}` });
  return pageMeta({
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description.slice(0, 160) || product.name,
    path: `/products/${product.slug}`,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, reviews] = await Promise.all([
    relatedProducts(product.id, product.categorySlug),
    listPublishedReviews(product.id),
  ]);
  const price = Number(product.salePrice ?? product.price);
  const demo = isDemoListing(product.sku, product.slug);
  const average = product.ratingAverage;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: product.images.map((i) => i.url),
    ...(demo
      ? {}
      : {
          offers: {
            "@type": "Offer",
            priceCurrency: "GHS",
            price,
            availability: product.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${getAppUrl()}/products/${product.slug}`,
          },
        }),
    ...(average && product.reviewCount > 0 && !demo
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: average.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const faqs = [
    {
      q: "When will it arrive?",
      a: "Collection is at the Accra shop. Delivery charge and timing are confirmed on WhatsApp after you order. Checkout does not add a delivery fee.",
    },
    {
      q: "Can I return it?",
      a: "Faulty, damaged, or incorrect items can be returned within 7 days of delivery. See the refund policy for conditions.",
    },
    {
      q: "How do I pay?",
      a: "Checkout uses Hubtel and/or Moolre when those accounts are configured. We do not store card or mobile-money credentials.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-32 lg:px-8 lg:py-12 lg:pb-12">
      <TrackViewed slug={product.slug} name={product.name} imageUrl={product.primaryImage?.url ?? null} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(jsonLd) }} />
      <nav className="text-sm text-muted">
        <Link href="/shop">Shop</Link>
        {product.categorySlug ? (
          <>
            {" / "}
            <Link href={`/shop/${product.categorySlug}`}>{product.categoryName}</Link>
          </>
        ) : null}
        {" / "}
        <span>{product.name}</span>
      </nav>
      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <ProductGallery images={product.images} name={product.name} outOfStock={product.available <= 0} />
        <div>
          {product.categoryName ? <p className="text-xs uppercase tracking-wide text-muted">{product.categoryName}</p> : null}
          <h1 className="mt-2 text-3xl md:text-4xl">{product.name}</h1>
          {product.reviewCount > 0 ? (
            <div className="mt-2">
              <StarRating average={product.ratingAverage} count={product.reviewCount} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No published reviews yet</p>
          )}
          {product.salePrice ? (
            <p className="mt-3 text-xs uppercase tracking-wide text-accent">On promo</p>
          ) : null}
          {product.salePrice ? (
            <p className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-lg text-muted line-through">{formatGhs(Number(product.price))}</span>
              <SalePriceBubble className="px-5 py-2.5 text-2xl md:text-3xl">{formatGhs(price)}</SalePriceBubble>
            </p>
          ) : (
            <p className="price mt-5 text-3xl md:text-4xl">{formatGhs(price)}</p>
          )}
          {demo ? (
            <p className="mt-4 rounded-2xl border border-accent bg-accent/5 p-3 text-sm">
              This is a demo listing for layout. It is not an offer for sale. Price, photograph, and specifications
              must be confirmed against stock in the Accra shop.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Prices in Ghana Cedis as shown. Payment is taken only when checkout is configured.</p>
          )}
          <p className="mt-6 whitespace-pre-wrap leading-relaxed text-muted">
            {product.description || "Description will be added by the store."}
          </p>
          <div className="mt-8">
            <AddToCart product={product} />
          </div>
          <p className="mt-4 text-sm text-muted">Stock is checked again when you place the order. A thank-you page is not proof of payment.</p>

          <details className="mt-8 border-t border-border pt-4" open>
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">Product details</summary>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">SKU</dt>
                <dd>{product.sku}</dd>
              </div>
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-muted">{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </details>
          <details className="border-t border-border py-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">Care and compatibility</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Follow the care notes in the specifications. Confirm plug type, wattage, and hob compatibility against the
              unit on the shelf before treating a demo listing as final.
            </p>
          </details>
          <details className="border-t border-border py-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">Shipping and returns</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{faqs[0].a}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{faqs[1].a}</p>
          </details>
          <details className="border-t border-border py-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">Questions</summary>
            <ul className="mt-3 space-y-3 text-sm">
              {faqs.map((item) => (
                <li key={item.q}>
                  <p className="font-medium">{item.q}</p>
                  <p className="mt-1 text-muted">{item.a}</p>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[var(--store-dock)] z-50 border-t border-border bg-surface/95 p-3 pr-16 shadow-[var(--shadow)] backdrop-blur lg:sticky lg:inset-x-auto lg:bottom-4 lg:z-30 lg:mt-8 lg:rounded-sm lg:border lg:pr-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium sm:text-base">{product.name}</p>
            {product.salePrice ? (
              <SalePriceBubble className="text-base">{formatGhs(price)}</SalePriceBubble>
            ) : (
              <p className="price text-base sm:text-lg">{formatGhs(price)}</p>
            )}
          </div>
          <AddToCart product={product} sticky />
        </div>
      </div>

      <ProductReviews productId={product.id} slug={product.slug} reviews={reviews} allowSubmit={!demo} />
      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-2xl">Related products</h2>
          <ProductRail products={related} className="mt-8" />
        </section>
      ) : null}
      <RecentlyViewed excludeSlug={product.slug} />
    </div>
  );
}
