"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminButton } from "@/components/admin/ui";

export function ImageUpload({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <form
      className="mt-6 space-y-4 border-t border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] pt-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setPending(true);
        setMessage(null);
        const response = await fetch("/api/admin/images", { method: "POST", body: data });
        const json = (await response.json()) as { ok: boolean; error?: string };
        setPending(false);
        setMessage(json.ok ? "Photo added." : json.error ?? "Could not add that photo. Try a JPEG or PNG under 6 MB.");
        if (json.ok) {
          form.reset();
          setFileName(null);
          router.refresh();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <label className="admin-drop">
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="sr-only"
          onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? null)}
        />
        <span className="font-serif text-lg">{fileName ?? "Drop a photo here, or tap to choose"}</span>
        <span className="text-xs text-muted">JPEG, PNG, or WebP. 6 MB or smaller.</span>
      </label>
      <label className="block text-sm">
        Photo name (optional)
        <span className="mt-0.5 block text-xs text-muted">Leave this as the product name if you like.</span>
        <input name="alt" defaultValue={productName} className="input mt-1" />
      </label>
      <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
        Make this the main photo
        <input type="checkbox" name="isPrimary" defaultChecked className="size-5 accent-[#c8102e]" />
      </label>
      <button type="submit" disabled={pending} className={adminButton()}>
        {pending ? "Adding photo…" : "Add photo"}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
