"use client";

import { useState } from "react";
import type { ProductImage } from "@/server/catalog/types";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-background text-sm text-muted">
        Photograph not uploaded yet
      </div>
    );
  }
  const current = images[active];
  return (
    <div className="-mx-4 lg:mx-0">
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="block aspect-square w-full overflow-hidden bg-background lg:rounded-3xl"
        aria-label={`Enlarge ${current.alt || name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.alt || name} className="h-full w-full object-cover" />
      </button>
      {images.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 touch-manipulation lg:px-0">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ${index === active ? "ring-2 ring-accent" : ""}`}
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {zoomed ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image"
        >
          <button type="button" className="absolute right-3 top-3 min-h-11 px-3 text-sm text-white sm:right-6 sm:top-6" onClick={() => setZoomed(false)}>
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={current.alt || name} className="max-h-full max-w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}
