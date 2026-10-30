"use client";

import { useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
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
  actionPath,
  categoryInPath,
}: {
  params: CatalogSearch;
  sort: string;
  extraOpen: boolean;
  actionPath: string;
  categoryInPath?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const filtered = Boolean(params.q?.trim() || params.min?.trim() || params.max?.trim() || params.stock === "1");

  function submitForm(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const next = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const text = String(value).trim();
      if (text) next.set(key, text);
    }
    const query = next.toString();
    router.push(query ? `${actionPath}?${query}` : actionPath);
  }
  const filterLabel =
    params.min || params.max || params.stock
      ? [params.min ? `from GH₵${params.min}` : null, params.max ? `to GH₵${params.max}` : null, params.stock === "1" ? "in stock" : null]
          .filter(Boolean)
          .join(" · ")
      : "Price and stock";

  return (
    <form ref={formRef} className="mt-3" method="get" action={actionPath} onSubmit={submitForm}>
      {params.featured === "1" ? <input type="hidden" name="featured" value="1" /> : null}
      {params.new === "1" ? <input type="hidden" name="new" value="1" /> : null}
      {params.sale === "1" ? <input type="hidden" name="sale" value="1" /> : null}
      {params.category && !categoryInPath ? <input type="hidden" name="category" value={params.category} /> : null}
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="relative min-w-0">
          <span className="sr-only">Search this aisle</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Search this aisle"
            enterKeyHint="search"
            autoComplete="off"
            className="input w-full appearance-none py-3 !pl-11 [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:appearance-none"
          />
        </label>
        <button type="submit" className="sr-only">
          Search
        </button>
        <select
          name="sort"
          defaultValue={sort}
          aria-label="Sort products"
          className="input min-w-0"
          onChange={() => submitForm()}
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      <details className="group mt-2 overflow-hidden rounded-xl border border-border bg-surface" open={extraOpen || undefined}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm [&::-webkit-details-marker]:hidden">
          <span className={cn(extraOpen ? "text-foreground" : "text-muted")}>{filterLabel}</span>
          <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" strokeWidth={1.75} />
        </summary>
        <div className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:flex sm:flex-wrap sm:items-end">
          <label className="col-span-1 min-w-0 text-xs text-muted">
            Min GH₵
            <input name="min" defaultValue={params.min} placeholder="0" inputMode="numeric" className="input mt-1" />
          </label>
          <label className="col-span-1 min-w-0 text-xs text-muted">
            Max GH₵
            <input name="max" defaultValue={params.max} placeholder="Any" inputMode="numeric" className="input mt-1" />
          </label>
          <label className="col-span-2 flex min-h-11 items-center gap-2 text-sm sm:px-1">
            <input type="checkbox" name="stock" value="1" defaultChecked={params.stock === "1"} className="size-4 accent-[var(--accent)]" />
            In stock only
          </label>
          <button type="submit" className={buttonClass("primary", "col-span-2 min-h-11 w-full sm:w-auto")}>
            Apply
          </button>
        </div>
      </details>
      {filtered ? (
        <Link href={actionPath} className="mt-1 inline-flex min-h-9 items-center text-sm text-muted">
          Clear search and filters
        </Link>
      ) : null}
    </form>
  );
}
