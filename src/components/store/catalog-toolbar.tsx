"use client";

import { useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CatalogSearch = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  stock?: string;
  featured?: string;
  new?: string;
  sale?: string;
};

export function CatalogToolbar({
  params,
  sort,
  extraOpen,
  basePath,
  category,
}: {
  params: CatalogSearch;
  sort: string;
  extraOpen: boolean;
  basePath: "/shop" | "/products";
  category?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const filtered = Boolean(params.q || params.min || params.max || params.stock);

  return (
    <form ref={formRef} className="mt-4" method="get" action={basePath}>
      {params.featured === "1" ? <input type="hidden" name="featured" value="1" /> : null}
      {params.new === "1" ? <input type="hidden" name="new" value="1" /> : null}
      {params.sale === "1" ? <input type="hidden" name="sale" value="1" /> : null}
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="relative min-w-0">
          <span className="sr-only">Search the shop</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search the shop"
            className="input w-full pl-10"
          />
        </label>
        <button type="submit" className="sr-only">
          Search
        </button>
        <select
          name="sort"
          defaultValue={sort}
          aria-label="Sort products"
          className="input"
          onChange={() => formRef.current?.requestSubmit()}
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      <details className="mt-2" open={extraOpen || undefined}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-muted">
          Price and stock
        </summary>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input name="min" defaultValue={params.min} placeholder="Min GH₵" inputMode="numeric" className="input max-w-28" />
          <input name="max" defaultValue={params.max} placeholder="Max GH₵" inputMode="numeric" className="input max-w-28" />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="stock" value="1" defaultChecked={params.stock === "1"} />
            In stock
          </label>
          <button type="submit" className="text-sm font-medium text-accent">
            Apply
          </button>
        </div>
      </details>
      {filtered ? (
        <Link href={basePath} className={cn("mt-2 inline-flex min-h-11 items-center text-sm text-muted")}>
          Clear filters
        </Link>
      ) : null}
    </form>
  );
}
