"use client";

export type Toast = { id: number; message: string };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts() {
  return toasts;
}

const EMPTY_TOASTS: Toast[] = [];

export function getServerToasts(): Toast[] {
  return EMPTY_TOASTS;
}

export function pushToast(message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, message }];
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    emit();
  }, 2800);
}
