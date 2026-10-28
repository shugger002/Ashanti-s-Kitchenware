"use client";

import { archiveProductAction } from "@/app/admin/products/actions";

export function ArchiveProductButton({ productId, name }: { productId: string; name: string }) {
  return (
    <form
      action={archiveProductAction}
      className="mt-10 max-w-2xl"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `${name} will leave this desk forever. Past orders keep the line. Use Hide if you only want it off the shop.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <button type="submit" className="text-sm text-accent">
        Remove from the shop forever
      </button>
    </form>
  );
}
