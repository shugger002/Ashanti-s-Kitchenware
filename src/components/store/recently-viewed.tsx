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
    <section className="mt-16">
      <h2 className="text-2xl">Recently viewed</h2>
      <ul className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {list.map((item) => (
          <li key={item.slug} className="w-36 shrink-0">
            <Link href={`/products/${item.slug}`}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-36 w-36 rounded-2xl object-cover" />
              ) : (
                <div className="h-36 w-36 rounded-2xl bg-surface" />
              )}
              <p className="mt-2 text-sm">{item.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
