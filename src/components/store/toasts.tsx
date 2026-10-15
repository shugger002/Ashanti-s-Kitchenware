"use client";

import { useSyncExternalStore } from "react";
import { getServerToasts, getToasts, subscribeToasts } from "@/components/store/toast-store";

export function Toasts() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);
  if (items.length === 0) return null;
  return (
    <ul
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--store-dock)+4.25rem)] z-[60] mx-auto flex max-w-sm flex-col gap-2 px-4 lg:bottom-8"
      aria-live="polite"
    >
      {items.map((toast) => (
        <li key={toast.id} className="rounded-2xl bg-foreground px-4 py-3 text-center text-sm text-background shadow-[var(--shadow)]">
          {toast.message}
        </li>
      ))}
    </ul>
  );
}
