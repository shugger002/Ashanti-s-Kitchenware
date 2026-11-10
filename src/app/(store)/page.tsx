import { Suspense } from "react";
import Link from "next/link";
import { LogoMarquee } from "@/components/store/logo-marquee";
import { HomeArrivals, HomeCatalog, HomeIntroAndAisles, HomeNewsletter } from "@/components/store/home-stream";
import { HomeIntroSkeleton, HomeRailBlockSkeleton, Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { brandValues, editorialCollections, lifestyleBlocks } from "@/content/collections";
import { journalArticles } from "@/content/journal";
import { pageMeta } from "@/lib/seo";
import { mediaZoomClass } from "@/lib/utils";

export const metadata = pageMeta({
  title: "Kitchen appliances in Accra",
  description:
    "Kitchen appliances from the Accra shop, priced in Ghana Cedis.",
  path: "/",
});

export default function HomePage() {
  const story = lifestyleBlocks[0];

  return (
    <div>
      <section className="overflow-hidden bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/demo/hero.jpg?v=2"
          alt="Kitchen utensils hung on a wall and arranged on a counter (layout photograph)"
          width={1470}
          height={1420}
          fetchPriority="high"
          decoding="async"
          className="h-[min(42dvh,18rem)] w-full object-cover object-[center_42%] md:h-[min(85dvh,calc(100vw*710/735))]"
        />
      </section>

      <h1 className="sr-only">Ashanti's Kitchenware, kitchen appliances in Accra</h1>

      <LogoMarquee />

      <Suspense fallback={<HomeIntroSkeleton />}>
        <HomeIntroAndAisles />
      </Suspense>

      <Suspense
        fallback={
          <>
            <HomeRailBlockSkeleton />
            <HomeRailBlockSkeleton />
          </>
        }
      >
        <HomeCatalog />
      </Suspense>

      <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-16">
        <h2 className="text-center text-2xl md:text-3xl">Sets from the current catalogue</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          Editorial groupings, not discounted bundles. Add each piece on its own product page.
        </p>
        <ul className="-mx-4 mt-6 flex snap-x snap-proximity gap-4 overflow-x-auto px-4 pb-2 touch-manipulation md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
          {editorialCollections.map((collection) => (
            <li key={collection.title} className="w-[78%] shrink-0 snap-start md:w-auto">
              <Link href={collection.href} className="group block">
                <span className="block overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={collection.image} alt="" className={`aspect-[4/5] w-full object-cover ${mediaZoomClass}`} />
                </span>
                <h3 className="mt-3 font-serif text-xl md:mt-4 md:text-2xl">{collection.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{collection.text}</p>
                <span className="mt-3 inline-block min-h-11 py-2 text-sm text-accent">Shop this range</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {story ? (
        <section className="grid md:grid-cols-2">
          <div className="overflow-hidden bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.image} alt="" className="h-full min-h-[14rem] w-full object-cover md:min-h-[520px]" />
          </div>
          <div className="flex flex-col justify-center bg-accent px-4 py-10 text-white md:px-14 md:py-14">
            <p className="text-xs uppercase tracking-[0.22em] text-white/80">From the Accra shop</p>
            <h2 className="mt-3 text-2xl text-white md:mt-4 md:text-4xl">{story.title}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90 md:text-base">{story.text}</p>
            <Link
              href={story.href}
              className={`${buttonClass("secondary", "mt-6 h-12 w-full bg-white text-accent hover:bg-white/90 md:mt-8 md:w-fit")}`}
            >
              Shop appliances
            </Link>
          </div>
        </section>
      ) : null}

      <section className="px-4 py-10 md:px-5 md:py-20">
        <h2 className="text-center text-2xl md:text-3xl">How we list stock</h2>
        <ul className="mx-auto mt-8 grid max-w-4xl gap-x-12 gap-y-6 sm:grid-cols-2 md:mt-10 md:gap-y-8">
          {brandValues.slice(0, 4).map((value) => (
            <li key={value.title}>
              <h3 className="font-serif text-xl">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <Suspense fallback={<HomeRailBlockSkeleton />}>
        <HomeArrivals />
      </Suspense>

      <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl md:text-3xl">Guides</h2>
          <Link href="/journal" className="min-h-11 py-2 text-sm text-accent">
            All guides
          </Link>
        </div>
        <ul className="-mx-4 mt-6 flex snap-x snap-proximity gap-4 overflow-x-auto px-4 pb-2 touch-manipulation md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
          {journalArticles.map((article) => (
            <li key={article.slug} className="w-[78%] shrink-0 snap-start md:w-auto">
              <Link href={`/journal/${article.slug}`} className="group block">
                <span className="block overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.image} alt={article.imageAlt} className={`h-40 w-full object-cover md:h-52 ${mediaZoomClass}`} />
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

      <Suspense
        fallback={
          <div className="bg-accent/10 px-4 py-10 md:py-20" aria-busy="true" role="status" aria-label="Loading newsletter">
            <Skeleton className="mx-auto h-8 w-56" />
            <Skeleton className="mx-auto mt-3 h-4 w-full max-w-md" />
            <Skeleton className="mx-auto mt-8 h-12 w-full max-w-md" />
          </div>
        }
      >
        <HomeNewsletter />
      </Suspense>
    </div>
  );
}
