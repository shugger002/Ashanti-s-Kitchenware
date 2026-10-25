"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductRailScroller({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 12);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  function move(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rail-card]");
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.75;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <div className={cn("relative", className)}>
      {canPrev ? (
        <button
          type="button"
          aria-label="Previous products"
          className="absolute left-1 top-[28%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 shadow-[var(--shadow)] lg:flex"
          onClick={() => move(-1)}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
      ) : null}
      {canNext ? (
        <button
          type="button"
          aria-label="Next products"
          className="absolute right-1 top-[28%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 shadow-[var(--shadow)] lg:flex"
          onClick={() => move(1)}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
        </button>
      ) : null}
      <div
        ref={scroller}
        tabIndex={0}
        aria-label="Product list"
        className="flex snap-x snap-proximity gap-5 overflow-x-auto overscroll-x-contain overscroll-y-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] touch-manipulation [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
