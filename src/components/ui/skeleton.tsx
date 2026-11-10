import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

function dots(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

export function ProductCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="flex flex-col">
      <Skeleton className={cn("w-full", featured ? "aspect-[4/5]" : "aspect-square")} />
      <Skeleton className="mt-3 h-4 w-3/4 md:mt-4 md:h-5" />
      <Skeleton className="mt-2 h-3 w-20" />
      <Skeleton className="mt-3 h-6 w-24" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  columns = "catalog",
}: {
  count?: number;
  columns?: "catalog" | "shop";
}) {
  return (
    <div
      className={
        columns === "shop"
          ? "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3"
          : "grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
      }
    >
      {dots(count).map((index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProductRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {dots(count).map((index) => (
        <div key={index} className="w-[70%] shrink-0 sm:w-[46%] lg:w-[28%]">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function CatalogPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-24 lg:px-8 lg:py-10" aria-busy="true" role="status" aria-label="Loading catalogue">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="mt-4 h-11 w-full" />
      <div className="mt-3 flex gap-2 overflow-hidden">
        {dots(6).map((index) => (
          <Skeleton key={index} className="h-11 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-6">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}

export function CategoryBrowseSkeleton() {
  return (
    <div className="pb-24" aria-busy="true" role="status" aria-label="Loading categories">
      <div className="border-b border-border px-4 pt-3 md:mx-auto md:max-w-6xl md:px-8">
        <Skeleton className="h-10 w-full rounded-sm" />
        <div className="mt-3 flex gap-2 overflow-hidden pb-3">
          {dots(8).map((index) => (
            <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-sm" />
          ))}
        </div>
      </div>
      <div className="flex md:mx-auto md:max-w-6xl md:gap-6 md:px-8 md:pt-4">
        <div className="w-[15vw] min-w-16 max-w-[5.125rem] space-y-2 p-2 md:w-52 md:max-w-none">
          {dots(8).map((index) => (
            <Skeleton key={index} className="mx-auto size-10 rounded-sm md:h-10 md:w-full" />
          ))}
        </div>
        <div className="min-w-0 flex-1 px-3 py-3">
          <Skeleton className="w-full rounded-sm" style={{ aspectRatio: "2.9 / 1" }} />
          <div className="mt-3">
            <Skeleton className="h-6 w-40" />
            <div className="mt-3">
              <ProductGridSkeleton count={8} columns="shop" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopProductsSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label="Loading products">
      <Skeleton className="w-full rounded-sm" style={{ aspectRatio: "2.9 / 1" }} />
      <div className="mt-3">
        <Skeleton className="h-6 w-40" />
        <div className="mt-3">
          <ProductGridSkeleton count={8} columns="shop" />
        </div>
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label="Loading shop">
      <Skeleton className="h-[min(42dvh,18rem)] w-full rounded-none md:h-[min(85dvh,calc(100vw*710/735))]" />
      <Skeleton className="h-12 w-full rounded-none" />
      <HomeIntroSkeleton />
      <HomeRailBlockSkeleton />
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-16">
        <Skeleton className="mx-auto h-8 w-64" />
        <div className="mt-6 flex gap-4 overflow-hidden md:grid md:grid-cols-3">
          {dots(3).map((index) => (
            <div key={index} className="w-[78%] shrink-0 md:w-auto">
              <Skeleton className="aspect-[4/5] w-full" />
              <Skeleton className="mt-3 h-6 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2">
        <Skeleton className="min-h-[14rem] w-full rounded-none md:min-h-[520px]" />
        <div className="bg-accent/10 px-4 py-10 md:px-14 md:py-14">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <Skeleton className="mt-4 h-16 w-full" />
          <Skeleton className="mt-8 h-12 w-40" />
        </div>
      </div>
      <HomeRailBlockSkeleton />
      <div className="bg-accent/10 px-4 py-10 md:py-20">
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="mx-auto mt-3 h-4 w-full max-w-md" />
        <Skeleton className="mx-auto mt-8 h-12 w-full max-w-md" />
      </div>
    </div>
  );
}

export function HomeIntroSkeleton() {
  return (
    <section className="border-y border-border py-8 md:py-16" aria-busy="true" role="status" aria-label="Loading aisles">
      <div className="mx-auto max-w-6xl px-4 text-center lg:px-8">
        <Skeleton className="mx-auto h-10 w-72 max-w-full" />
        <Skeleton className="mx-auto mt-3 h-4 w-full max-w-md" />
        <Skeleton className="mx-auto mt-6 h-12 w-40" />
      </div>
      <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-2.5 px-4 lg:grid-cols-3 lg:px-8">
        {dots(6).map((index) => (
          <li key={index}>
            <Skeleton className="aspect-[4/3] w-full md:h-64 md:aspect-auto" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeRailBlockSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-16" aria-busy="true" role="status" aria-label="Loading products">
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 md:mt-10">
        <ProductRailSkeleton />
      </div>
    </section>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-32 lg:px-8 lg:py-12" aria-busy="true" role="status" aria-label="Loading product">
      <Skeleton className="h-4 w-40" />
      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="aspect-square w-full" />
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-10 w-3/4" />
          <Skeleton className="mt-4 h-4 w-32" />
          <Skeleton className="mt-6 h-10 w-40" />
          <Skeleton className="mt-6 h-24 w-full" />
          <Skeleton className="mt-8 h-12 w-full" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-8 h-12 w-full" />
          <Skeleton className="mt-2 h-12 w-full" />
          <Skeleton className="mt-2 h-12 w-full" />
        </div>
      </div>
      <div className="mt-10 border-t border-border pt-8">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-4 h-16 w-full" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
      <div className="mt-16">
        <Skeleton className="h-8 w-56" />
        <div className="mt-8">
          <ProductRailSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ProductReviewsSkeleton() {
  return (
    <section className="mt-10 border-t border-border pt-8 md:mt-16 md:pt-10" aria-busy="true" role="status" aria-label="Loading reviews">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      <div className="mt-6 space-y-4">
        {dots(3).map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12" aria-busy="true" role="status" aria-label="Loading checkout">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          {dots(3).map((index) => (
            <div key={index} className="space-y-3 border-b border-border pb-8">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-2/3" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          {dots(3).map((index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-36 lg:px-8 lg:py-12" aria-busy="true" role="status" aria-label="Loading cart">
      <Skeleton className="h-10 w-36" />
      <ul className="mt-10 divide-y divide-border">
        {dots(4).map((index) => (
          <li key={index} className="flex gap-4 py-5">
            <Skeleton className="h-20 w-20 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-4 h-9 w-32" />
            </div>
          </li>
        ))}
      </ul>
      <Skeleton className="mt-8 h-7 w-40" />
      <Skeleton className="mt-4 h-12 w-48" />
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <div className="mx-auto max-w-md px-4 py-8 lg:px-5 lg:py-16" aria-busy="true" role="status" aria-label="Loading sign in">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 lg:px-8 lg:py-16" aria-busy="true" role="status" aria-label="Loading account">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-10 w-52" />
      <Skeleton className="mt-6 h-28 w-full rounded-2xl" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {dots(3).map((index) => (
          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-10 h-7 w-32" />
      <div className="mt-4 space-y-3">
        {dots(4).map((index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ContentPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 lg:px-8 lg:py-16" aria-busy="true" role="status" aria-label="Loading page">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-6 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-5/6" />
      <Skeleton className="mt-10 h-8 w-40" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <Skeleton className="mt-10 h-8 w-52" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-4/5" />
    </div>
  );
}

export function HeroContentSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label="Loading page">
      <Skeleton className="h-[42dvh] w-full rounded-none" />
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8 lg:py-16">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-4/5" />
        <Skeleton className="mt-10 h-8 w-40" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-5/6" />
      </div>
    </div>
  );
}

export function ContactPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 lg:px-8 lg:py-16" aria-busy="true" role="status" aria-label="Loading contact">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-8 h-4 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-12 w-full sm:w-32" />
        <Skeleton className="h-12 w-full sm:w-32" />
        <Skeleton className="h-12 w-full sm:w-32" />
      </div>
      <Skeleton className="mt-10 h-48 w-full" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-40" />
      </div>
    </div>
  );
}

export function JournalPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 lg:px-8 lg:py-16" aria-busy="true" role="status" aria-label="Loading guides">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-10 w-40" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <ul className="mt-8 grid gap-8 md:grid-cols-3">
        {dots(3).map((index) => (
          <li key={index}>
            <Skeleton className="h-44 w-full md:h-52" />
            <Skeleton className="mt-3 h-3 w-32" />
            <Skeleton className="mt-2 h-7 w-4/5" />
            <Skeleton className="mt-2 h-4 w-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JournalArticleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 lg:px-8 lg:py-16" aria-busy="true" role="status" aria-label="Loading guide">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-48 w-full sm:h-80" />
      <Skeleton className="mt-6 h-3 w-48" />
      <Skeleton className="mt-3 h-10 w-5/6" />
      <Skeleton className="mt-4 h-5 w-full" />
      <Skeleton className="mt-10 h-8 w-56" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <div className="mt-16">
        <Skeleton className="h-8 w-64" />
        <div className="mt-8">
          <ProductRailSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}

export function TrackOrderSkeleton() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-24 lg:px-8 lg:py-16" aria-busy="true" role="status" aria-label="Loading order tracker">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-8 h-12 w-full" />
      <Skeleton className="mt-3 h-12 w-32" />
      <Skeleton className="mt-10 h-32 w-full" />
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label="Loading desk">
      <Skeleton className="mx-auto h-8 w-64" />
      <Skeleton className="mx-auto mt-3 h-4 w-80 max-w-full" />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dots(8).map((index) => (
          <li key={index} className="rounded-xl border border-border bg-white p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-16" />
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-xl border border-border bg-white p-5">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 space-y-3">
          {dots(6).map((index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoreChromeSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-9 w-full rounded-none" />
      <div className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 lg:px-8">
        <Skeleton className="h-8 w-36" />
        <div className="hidden gap-3 md:flex">
          {dots(5).map((index) => (
            <Skeleton key={index} className="h-4 w-16" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex h-[var(--store-dock)] items-center justify-around border-t border-border bg-background px-2 lg:hidden">
        {dots(4).map((index) => (
          <Skeleton key={index} className="size-10 rounded-full" />
        ))}
      </div>
    </div>
  );
}
