"use client";

import { useState } from "react";
import { type ProductCsvResult } from "@/lib/desk-import";
import { downloadDeskFile, postDeskForm } from "@/components/admin/desk-file";
import { adminButton } from "@/components/admin/ui";

const failed: ProductCsvResult = {
  ok: false,
  message: "Could not import that file.",
  created: [],
  skipped: [],
  attached: [],
  unmatched: [],
  errors: [],
};

export function ProductCsvForm() {
  const [state, setState] = useState<ProductCsvResult | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-lg font-medium">Upload products CSV or PDF</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Download the template, or upload CSV, Excel, or a spreadsheet PDF. Google Sheets: File → Download → CSV.
        Required: <span className="text-foreground">name</span>,{" "}
        <span className="text-foreground">sku</span>, <span className="text-foreground">price</span> in Ghana Cedis.
        Set <span className="text-foreground">listed</span> to yes to publish. Name photographs after the SKU or the
        product name (<span className="text-foreground">AK-KETTLE.jpg</span> or{" "}
        <span className="text-foreground">Stainless Kettle.jpg</span>; extra shots{" "}
        <span className="text-foreground">Stainless Kettle-2.jpg</span>). SKU wins if both could match. Existing SKUs
        are skipped; matching photos still attach.
      </p>
      <div className="mt-4">
        <button
          type="button"
          className="text-sm text-accent underline-offset-2 hover:underline"
          onClick={() => downloadDeskFile("/api/admin/products-template")}
        >
          Download template
        </button>
      </div>
      <form
        encType="multipart/form-data"
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          setPending(true);
          void postDeskForm("/api/admin/products-import", form, failed)
            .then((result) => setState(result))
            .finally(() => setPending(false));
        }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-0 flex-1 text-sm">
            CSV or PDF
            <input
              name="file"
              type="file"
              className="mt-1 block w-full cursor-pointer rounded-md border border-border bg-white py-2 pl-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </label>
          <label className="block min-w-0 flex-1 text-sm">
            Photographs
            <input
              name="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-1 block w-full cursor-pointer rounded-md border border-border bg-white py-2 pl-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </label>
        </div>
        <button className={adminButton()} type="submit" disabled={pending}>
          {pending ? "Reading spreadsheet…" : "Add products"}
        </button>
      </form>
      {state ? (
        <div className="mt-4 space-y-2 text-sm">
          <p className={state.ok ? "font-medium" : "text-accent"}>{state.message}</p>
          {state.created.length > 0 ? <p className="text-muted">Added: {state.created.join(", ")}</p> : null}
          {state.skipped.length > 0 ? <p className="text-muted">Already on the desk: {state.skipped.join(", ")}</p> : null}
          {state.attached.length > 0 ? <p className="text-muted">Photos: {state.attached.join("; ")}</p> : null}
          {state.unmatched.length > 0 ? <p className="text-accent">No SKU match: {state.unmatched.join(", ")}</p> : null}
          {state.errors.length > 0 ? (
            <ul className="space-y-1 text-accent">
              {state.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
