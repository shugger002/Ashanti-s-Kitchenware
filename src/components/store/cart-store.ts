"use client";

export type CartLine = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
};

const STORAGE_KEY = "ak_cart_v1";
const EMPTY_CART: CartLine[] = [];
let memory: CartLine[] = EMPTY_CART;
let hydrated = false;
let drawerOpen = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCartSnapshot(): CartLine[] {
  return hydrated ? memory : EMPTY_CART;
}

export function getServerCartSnapshot(): CartLine[] {
  return EMPTY_CART;
}

export function getServerCartDrawerSnapshot() {
  return false;
}

export function hydrateCartFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memory = raw ? (JSON.parse(raw) as CartLine[]) : EMPTY_CART;
  } catch {
    memory = EMPTY_CART;
  }
  hydrated = true;
  emit();
}

export function writeCart(next: CartLine[]): void {
  memory = next;
  hydrated = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

export function isCartDrawerOpen() {
  return drawerOpen;
}

export function setCartDrawerOpen(open: boolean) {
  drawerOpen = open;
  emit();
}
