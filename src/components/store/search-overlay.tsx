"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

const RECENT_KEY = "ak_search_recent_v1";
const POPULAR = ["cookware", "kettle", "blender", "air fryer", "tableware"];

export type SearchHint = { slug: string; name: string; href: string; kind: "product" | "category" };

export function SearchOverlay({
  open,
  onClose,
  hints,
}: {
  open: boolean;
  onClose: () => void;
  hints: SearchHint[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[]);
    } catch {
      setRecent([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return hints.slice(0, 8);
    return hints.filter((hint) => hint.name.toLowerCase().includes(needle)).slice(0, 8);
  }, [q, hints]);

  function remember(term: string) {
    const next = [term, ...recent.filter((item) => item !== term)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  function go(term: string) {
    const value = term.trim();
    if (value) remember(value);
    onClose();
    router.push(value ? `/products?q=${encodeURIComponent(value)}` : "/products");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" className="absolute inset-0 hidden bg-black/40 md:block" aria-label="Close search" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        className="absolute inset-0 flex flex-col overflow-y-auto bg-background p-5 md:inset-x-0 md:top-0 md:bottom-auto md:mx-auto md:mt-16 md:max-h-[min(80vh,40rem)] md:max-w-2xl md:rounded-3xl md:bg-surface md:shadow-[var(--shadow)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="search-title" className="font-serif text-2xl">
            Search
          </h2>
          <button type="button" aria-label="Close search" onClick={onClose}>
            <X strokeWidth={1.5} />
          </button>
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            go(q);
          }}
        >
          <label htmlFor="overlay-search" className="sr-only">
            Search products
          </label>
          <input
            id="overlay-search"
            value={q}
            autoFocus
            onChange={(event) => setQ(event.target.value)}
            placeholder="Pots, kettles, appliances"
            className="input"
          />
          <button type="submit" className={buttonClass("primary")}>
            Search
          </button>
        </form>
        {matches.length > 0 ? (
          <ul className="mt-4 divide-y divide-border text-sm">
            {matches.map((hint) => (
              <li key={`${hint.kind}-${hint.slug}`}>
                <Link
                  href={hint.href}
                  className="flex items-center justify-between py-3"
                  onClick={() => {
                    remember(hint.name);
                    onClose();
                  }}
                >
                  <span>{hint.name}</span>
                  <span className="text-xs text-muted">{hint.kind === "category" ? "Category" : "Product"}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : q.trim() ? (
          <p className="mt-4 text-sm text-muted">
            We couldn’t find that.
          </p>
        ) : null}
        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Recent</p>
            <ul className="mt-2 space-y-1">
              {recent.length === 0 ? <li className="text-muted">No recent searches</li> : null}
              {recent.map((term) => (
                <li key={term}>
                  <button type="button" className="text-left hover:text-accent" onClick={() => go(term)}>
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Popular</p>
            <ul className="mt-2 space-y-1">
              {POPULAR.map((term) => (
                <li key={term}>
                  <button type="button" className="text-left hover:text-accent" onClick={() => go(term)}>
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
