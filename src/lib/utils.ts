import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const mediaZoomClass =
  "origin-center object-cover [backface-visibility:hidden] [transform:translate3d(0,0,0)_scale(1)] transition-transform duration-[1800ms] ease-[cubic-bezier(0.45,0.05,0.55,0.95)] group-hover:[transform:translate3d(0,0,0)_scale(1.03)] group-focus-within:[transform:translate3d(0,0,0)_scale(1.03)]";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function envFlag(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
