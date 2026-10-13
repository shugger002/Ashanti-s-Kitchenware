"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminButton } from "@/components/admin/ui";

export function ImageUpload({ productId }: { productId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="mt-6 space-y-3 border-t border-border pt-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const response = await fetch("/api/admin/images", { method: "POST", body: data });
        const json = (await response.json()) as { ok: boolean; error?: string };
        setMessage(json.ok ? "Image uploaded." : json.error ?? "Upload failed");
        if (json.ok) {
          form.reset();
          router.refresh();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <label className="block text-sm">
        Alt text
        <input name="alt" required className="input mt-1" />
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="isPrimary" /> Primary photograph
      </label>
      <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
      <p className="text-xs text-muted">JPEG, PNG, or WebP. 6 MB or smaller.</p>
      <button type="submit" className={adminButton()}>
        Upload
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
