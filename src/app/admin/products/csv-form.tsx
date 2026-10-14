"use client";

import { useActionState } from "react";
import { importProductsCsv, type ProductCsvState } from "@/app/admin/products/csv-actions";
import { adminButton } from "@/components/admin/ui";

export function ProductCsvForm() {
  const [state, action, pending] = useActionState(importProductsCsv, null as ProductCsvState);
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-lg font-medium">Upload products CSV</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Download the template and add one row per piece. Required: <span className="text-foreground">name</span>,{" "}
        <span className="text-foreground">sku</span>, <span className="text-foreground">price</span> in Ghana Cedis.
        Set <span className="text-foreground">listed</span> to yes to publish. Name photographs after the SKU or the
        product name (<span className="text-foreground">AK-KETTLE.jpg</span> or{" "}
        <span className="text-foreground">Stainless Kettle.jpg</span>; extra shots{" "}
        <span className="text-foreground">Stainless Kettle-2.jpg</span>). SKU wins if both could match. Existing SKUs
        are skipped; matching photos still attach.
      </p>
      <div className="mt-4">
        <a href="/admin/products/template" className="text-sm text-accent">
          Download template
        </a>
      </div>
      <form action={action} className="mt-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-0 flex-1 text-sm">
            CSV file
            <input name="file" type="file" accept=".csv,text/csv" className="input mt-1" />
          </label>
          <label className="block min-w-0 flex-1 text-sm">
            Photographs
            <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="input mt-1" />
          </label>
        </div>
        <button className={adminButton()} type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add products"}
        </button>
      </form>
      {state ? (
        <div className="mt-4 space-y-2 text-sm">
          <p className={state.ok ? "font-medium" : "text-accent"}>{state.message}</p>
          {state.created.length > 0 ? (
            <p className="text-muted">Added: {state.created.join(", ")}</p>
          ) : null}
          {state.skipped.length > 0 ? (
            <p className="text-muted">Already on the desk: {state.skipped.join(", ")}</p>
          ) : null}
          {state.attached.length > 0 ? (
            <p className="text-muted">Photos: {state.attached.join("; ")}</p>
          ) : null}
          {state.unmatched.length > 0 ? (
            <p className="text-accent">No SKU match: {state.unmatched.join(", ")}</p>
          ) : null}
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
