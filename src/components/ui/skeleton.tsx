import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function ProductCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="flex flex-col">
      <Skeleton className={cn("w-full", featured ? "aspect-[4/5]" : "aspect-square")} />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-3 w-24" />
      <Skeleton className="mt-3 h-6 w-28" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CatalogPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 lg:px-8 lg:py-10" aria-busy="true" aria-label="Loading catalogue">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="mt-4 h-11 w-full" />
      <div className="mt-3 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-5">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading shop">
      <Skeleton className="h-[min(85dvh,calc(100vw*710/735))] w-full rounded-none" />
      <div className="border-y border-border py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-5 text-center lg:px-8">
          <Skeleton className="mx-auto h-3 w-28" />
          <Skeleton className="mx-auto mt-4 h-10 w-72 max-w-full" />
          <Skeleton className="mx-auto mt-3 h-4 w-full max-w-md" />
          <Skeleton className="mx-auto mt-6 h-11 w-40" />
        </div>
        <ul className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-3 px-5 lg:grid-cols-3 lg:px-8">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <Skeleton className="aspect-[4/3] w-full" />
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <Skeleton className="h-8 w-56" />
        <div className="mt-8 flex gap-6 overflow-hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="w-64 shrink-0">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-12" aria-busy="true" aria-label="Loading product">
      <Skeleton className="h-4 w-40" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="aspect-square w-full" />
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-10 w-3/4" />
          <Skeleton className="mt-4 h-4 w-32" />
          <Skeleton className="mt-6 h-10 w-40" />
          <Skeleton className="mt-6 h-24 w-full" />
          <Skeleton className="mt-8 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 lg:py-12" aria-busy="true" aria-label="Loading cart">
      <Skeleton className="h-10 w-28" />
      <ul className="mt-10 divide-y divide-border">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex gap-4 py-5">
            <Skeleton className="h-20 w-20 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading desk">
      <Skeleton className="mx-auto h-8 w-64" />
      <Skeleton className="mx-auto mt-3 h-4 w-80 max-w-full" />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="rounded-xl border border-border bg-white p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-16" />
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-xl border border-border bg-white p-5">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
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
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}
