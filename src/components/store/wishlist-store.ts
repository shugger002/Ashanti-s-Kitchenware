"use client";

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  imageUrl: string | null;
};

const KEY = "ak_wishlist_v1";
let memory: WishlistItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeWishlist(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWishlist(): WishlistItem[] {
  return memory;
}

const EMPTY_WISHLIST: WishlistItem[] = [];

export function getServerWishlist(): WishlistItem[] {
  return EMPTY_WISHLIST;
}

export function hydrateWishlist() {
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  } catch {
    memory = [];
  }
  emit();
}

function write(next: WishlistItem[]) {
  memory = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function isWishlisted(productId: string) {
  return memory.some((item) => item.productId === productId);
}

export function toggleWishlist(item: WishlistItem) {
  write(
    isWishlisted(item.productId)
      ? memory.filter((entry) => entry.productId !== item.productId)
      : [...memory, item],
  );
}

export function removeWishlist(productId: string) {
  write(memory.filter((item) => item.productId !== productId));
}
