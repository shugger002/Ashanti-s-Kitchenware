"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { formatGhs } from "@/lib/money";

export type HeroSlide = {
  slug: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  price: string;
  salePrice: string | null;
  discount: number;
};

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const count = slides.length;
  const current = slides[index] ?? slides[0];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion || count < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % count);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, count]);

  if (!current) return null;

  function step(direction: -1 | 1) {
    setIndex((value) => (value + direction + count) % count);
  }

  return (
    <section
      className="relative bg-background"
      aria-roledescription="carousel"
      aria-label="Promo and shop pieces"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="relative h-[min(46dvh,20rem)] overflow-hidden md:h-[min(48vw,32rem)]">
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <div
              key={slide.slug}
              className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
              aria-hidden={!active}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.imageAlt}
                fill
                priority={slideIndex === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
              <Link href={`/products/${slide.slug}`} tabIndex={active ? 0 : -1} className="absolute inset-0">
                <span className="sr-only">{slide.name}</span>
              </Link>
            </div>
          );
        })}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent px-4 pr-16 pb-4 pt-16 md:px-8 md:pr-8 md:pb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            {current.discount > 0 ? "On promo" : "In the shop"}
          </p>
          <p className="mt-1 line-clamp-2 max-w-xl font-serif text-2xl leading-tight text-balance md:text-4xl">{current.name}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {current.salePrice ? (
              <>
                <span className="text-muted line-through">{formatGhs(current.price)}</span>
                <span className="rounded-full bg-accent px-3 py-1 font-bold text-white tabular-nums">
                  {formatGhs(current.salePrice)}
                </span>
                {current.discount > 0 ? (
                  <span className="text-xs font-medium uppercase tracking-wide text-accent">−{current.discount}%</span>
                ) : null}
              </>
            ) : (
              <span className="font-medium tabular-nums">{formatGhs(current.price)}</span>
            )}
          </p>
        </div>
      </div>
      {count > 1 ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.slug}
                type="button"
                role="tab"
                aria-selected={slideIndex === index}
                aria-label={`${slide.name}${slide.discount > 0 ? ", on promo" : ""}`}
                className={`h-1.5 rounded-full ${slideIndex === index ? "w-6 bg-accent" : "w-1.5 bg-border"}`}
                onClick={() => setIndex(slideIndex)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 max-lg:mr-16">
            <button
              type="button"
              className="flex size-11 items-center justify-center border border-border bg-surface text-foreground"
              aria-label="Previous piece"
              onClick={() => step(-1)}
            >
              <ChevronLeft className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="flex size-11 items-center justify-center border border-border bg-surface text-foreground"
              aria-label="Next piece"
              onClick={() => step(1)}
            >
              <ChevronRight className="size-5" strokeWidth={1.75} />
            </button>
            <Link href="/promo" className="hidden min-h-11 items-center px-2 text-sm text-accent sm:inline-flex">
              All promos
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
