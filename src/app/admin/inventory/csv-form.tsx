"use client";

import { useActionState } from "react";
import { importInventoryCsv, type InventoryCsvState } from "@/app/admin/inventory/actions";
import { adminButton } from "@/components/admin/ui";

export function InventoryCsvForm() {
  const [state, action, pending] = useActionState(importInventoryCsv, null as InventoryCsvState);
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-lg font-medium">Upload restock file</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        CSV or a spreadsheet saved as PDF from Chrome. Fill <span className="text-foreground">restock</span> with
        pieces arriving, or change <span className="text-foreground">on_hand</span> to the new shelf count. Match SKUs
        exactly. Unknown SKUs are skipped.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href="/admin/inventory/template" className="text-sm text-accent">
          Download template
        </a>
      </div>
      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block min-w-0 flex-1 text-sm">
          CSV or PDF
          <input
            name="file"
            type="file"
            accept=".csv,.pdf,text/csv,application/pdf"
            required
            className="input mt-1"
          />
        </label>
        <button className={adminButton("shrink-0")} type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update inventory"}
        </button>
      </form>
      {state ? (
        <div className="mt-4 space-y-2 text-sm">
          <p className={state.ok ? "font-medium" : "text-accent"}>{state.message}</p>
          {state.updated.length > 0 ? (
            <ul className="space-y-1 text-muted">
              {state.updated.map((row) => (
                <li key={row.sku}>
                  {row.sku}: {row.from} → {row.to}
                </li>
              ))}
            </ul>
          ) : null}
          {state.skipped.length > 0 ? (
            <p className="text-accent">Unknown SKU: {state.skipped.join(", ")}</p>
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
