"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { getServerViewed, getViewed, hydrateViewed, subscribeViewed } from "@/components/store/recently-viewed-store";

export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const items = useSyncExternalStore(subscribeViewed, getViewed, getServerViewed);
  useEffect(() => {
    hydrateViewed();
  }, []);
  const list = items.filter((item) => item.slug !== excludeSlug);
  if (list.length === 0) return null;
  return (
    <section className="mt-10 md:mt-16">
      <h2 className="text-xl md:text-2xl">Recently viewed</h2>
      <ul className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 touch-manipulation md:mx-0 md:mt-6 md:gap-4 md:px-0">
        {list.map((item) => (
          <li key={item.slug} className="w-28 shrink-0 sm:w-36">
            <Link href={`/products/${item.slug}`}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-28 w-28 rounded-2xl object-cover sm:h-36 sm:w-36" />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-surface sm:h-36 sm:w-36" />
              )}
              <p className="mt-2 line-clamp-2 text-sm">{item.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
