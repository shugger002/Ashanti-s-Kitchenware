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
        Set <span className="text-foreground">listed</span> to yes to publish. Photos can be a site path or image URL —
        photograph the shelf before going live. Existing SKUs are skipped.
      </p>
      <div className="mt-4">
        <a href="/admin/products/template" className="text-sm text-accent">
          Download template
        </a>
      </div>
      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block min-w-0 flex-1 text-sm">
          CSV file
          <input name="file" type="file" accept=".csv,text/csv" required className="input mt-1" />
        </label>
        <button className={adminButton("shrink-0")} type="submit" disabled={pending}>
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
