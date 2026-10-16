"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminButton } from "@/components/admin/ui";

export function ImageUpload({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="mt-6 space-y-3 border-t border-border pt-5"
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
          router.refresh();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <label className="block text-sm">
        Photo name (optional)
        <span className="mt-0.5 block text-xs text-muted">Leave this as the product name if you like.</span>
        <input name="alt" defaultValue={productName} className="input mt-1" />
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="isPrimary" defaultChecked /> Make this the main photo
      </label>
      <label className="block text-sm">
        Choose a photo
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 block w-full text-sm" />
      </label>
      <p className="text-xs text-muted">JPEG, PNG, or WebP. 6 MB or smaller.</p>
      <button type="submit" disabled={pending} className={adminButton()}>
        {pending ? "Adding photo…" : "Add photo"}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
