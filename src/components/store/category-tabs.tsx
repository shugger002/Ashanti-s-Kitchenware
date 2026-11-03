"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type CategoryTab = { href: string; slug: string; name: string };

export function CategoryTabs({ tabs, activeSlug }: { tabs: CategoryTab[]; activeSlug: string | null }) {
  const scroller = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const current = scroller.current?.querySelector("[data-active=true]");
    if (!(current instanceof HTMLElement)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    current.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [activeSlug]);

  return (
    <ul
      ref={scroller}
      className="flex flex-nowrap gap-2 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] touch-manipulation md:px-0 [&::-webkit-scrollbar]:hidden"
      aria-label="Main categories"
    >
      {tabs.map((tab) => {
        const active = tab.slug === (activeSlug ?? "all");
        return (
          <li key={tab.href} className="shrink-0">
            {tab.slug === "cookware" ? <span id="cooking-ware" className="sr-only" /> : null}
            {tab.slug === "storage-insulation" ? <span id="insulations" className="sr-only" /> : null}
            <Link
              href={tab.href}
              data-active={active ? "true" : "false"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 max-w-[11rem] items-center truncate rounded-sm px-3 text-sm font-medium transition-colors duration-200",
                active ? "bg-accent text-white" : "border border-border bg-surface text-foreground",
              )}
            >
              {tab.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
