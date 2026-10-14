"use client";

export type ViewedItem = {
  slug: string;
  name: string;
  imageUrl: string | null;
};

const KEY = "ak_viewed_v1";
const MAX = 8;
let memory: ViewedItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeViewed(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getViewed(): ViewedItem[] {
  return memory;
}

const EMPTY_VIEWED: ViewedItem[] = [];

export function getServerViewed(): ViewedItem[] {
  return EMPTY_VIEWED;
}

export function hydrateViewed() {
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as ViewedItem[]) : [];
  } catch {
    memory = [];
  }
  emit();
}

export function rememberViewed(item: ViewedItem) {
  const next = [item, ...memory.filter((entry) => entry.slug !== item.slug)].slice(0, MAX);
  memory = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}
