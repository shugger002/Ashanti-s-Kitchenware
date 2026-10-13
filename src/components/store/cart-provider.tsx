"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  getServerCartDrawerSnapshot,
  hydrateCartFromStorage,
  isCartDrawerOpen,
  setCartDrawerOpen,
  subscribeCart,
  writeCart,
  type CartLine,
} from "@/components/store/cart-store";

export type { CartLine };

type CartContextValue = {
  items: CartLine[];
  count: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (line: Omit<CartLine, "quantity">, quantity: number) => void;
  update: (productId: string, variantId: string | null, quantity: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: CartLine, productId: string, variantId: string | null) {
  return a.productId === productId && a.variantId === variantId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const drawerOpen = useSyncExternalStore(subscribeCart, isCartDrawerOpen, getServerCartDrawerSnapshot);

  useEffect(() => {
    hydrateCartFromStorage();
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      drawerOpen,
      openDrawer: () => setCartDrawerOpen(true),
      closeDrawer: () => setCartDrawerOpen(false),
      add: (line, quantity) => {
        const current = getCartSnapshot();
        const idx = current.findIndex((c) => sameLine(c, line.productId, line.variantId));
        if (idx >= 0) {
          const next = [...current];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          writeCart(next);
        } else {
          writeCart([...current, { ...line, quantity }]);
        }
        setCartDrawerOpen(true);
      },
      update: (productId, variantId, quantity) => {
        const current = getCartSnapshot();
        writeCart(
          quantity <= 0
            ? current.filter((c) => !sameLine(c, productId, variantId))
            : current.map((c) => (sameLine(c, productId, variantId) ? { ...c, quantity } : c)),
        );
      },
      remove: (productId, variantId) => {
        writeCart(getCartSnapshot().filter((c) => !sameLine(c, productId, variantId)));
      },
      clear: () => writeCart([]),
    }),
    [items, drawerOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
