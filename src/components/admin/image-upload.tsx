"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminButton } from "@/components/admin/ui";

export function ImageUpload({
  productId,
  productName,
  hasPhotos,
}: {
  productId: string;
  productName: string;
  hasPhotos: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [replaceMain, setReplaceMain] = useState(true);
  return (
    <form
      className={
        hasPhotos
          ? "mb-5 space-y-4 border-b border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] pb-5"
          : "space-y-4"
      }
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const replacing = hasPhotos && data.get("replacePrimary") === "on";
        setPending(true);
        setMessage(null);
        const response = await fetch("/api/admin/images", { method: "POST", body: data });
        const json = (await response.json().catch(() => null)) as { ok: boolean; error?: string } | null;
        setPending(false);
        if (!json) {
          setMessage("Could not save that photo. Try a JPEG, PNG, or WebP under 6 MB.");
          return;
        }
        setMessage(
          json.ok
            ? replacing
              ? "Main photo updated. This is the picture customers see first."
              : "Photo added."
            : json.error ?? "Could not add that photo. Try a JPEG or PNG under 6 MB.",
        );
        if (json.ok) {
          form.reset();
          setFileName(null);
          setReplaceMain(true);
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
        <span className="font-serif text-lg">
          {fileName ?? (hasPhotos ? "Choose a new main photo" : "Drop a photo here, or tap to choose")}
        </span>
        <span className="text-xs text-muted">JPEG, PNG, or WebP. 6 MB or smaller.</span>
      </label>
      <label className="block text-sm">
        Photo name (optional)
        <span className="mt-0.5 block text-xs text-muted">Leave this as the product name if you like.</span>
        <input name="alt" defaultValue={productName} className="input mt-1" />
      </label>
      {hasPhotos ? (
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          Replace the picture customers see first
          <input
            type="checkbox"
            name="replacePrimary"
            checked={replaceMain}
            onChange={(event) => setReplaceMain(event.currentTarget.checked)}
            className="size-5 accent-[#c8102e]"
          />
        </label>
      ) : (
        <input type="hidden" name="isPrimary" value="on" />
      )}
      <button type="submit" disabled={pending} className={adminButton()}>
        {pending ? "Saving photo…" : hasPhotos && replaceMain ? "Update main photo" : "Add photo"}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
