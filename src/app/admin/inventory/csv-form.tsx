"use client";

import { useState } from "react";
import { type InventoryCsvResult } from "@/lib/desk-import";
import { downloadDeskFile, postDeskForm } from "@/components/admin/desk-file";
import { adminButton } from "@/components/admin/ui";

const failed: InventoryCsvResult = {
  ok: false,
  message: "Could not import that file.",
  updated: [],
  skipped: [],
  errors: [],
};

export function InventoryCsvForm() {
  const [state, setState] = useState<InventoryCsvResult | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div className="admin-panel">
      <h2 className="text-lg font-medium">Restock from a file</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Upload a spreadsheet. Need a code or product name column, plus how many arrived, or the new shelf count.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="text-sm text-accent underline-offset-2 hover:underline"
          onClick={() => downloadDeskFile("/api/admin/inventory-template")}
        >
          Download template
        </button>
      </div>
      <form
        encType="multipart/form-data"
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          setPending(true);
          void postDeskForm("/api/admin/inventory-import", form, failed)
            .then((result) => setState(result))
            .finally(() => setPending(false));
        }}
      >
        <label className="block min-w-0 flex-1 text-sm">
          Spreadsheet (CSV or PDF)
          <input
            name="file"
            type="file"
            required
            className="mt-1 block w-full cursor-pointer rounded-md border border-border bg-white py-2 pl-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </label>
        <button className={adminButton("shrink-0")} type="submit" disabled={pending}>
          {pending ? "Reading spreadsheet…" : "Update inventory"}
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
            <p className="text-accent">These codes were not found: {state.skipped.join(", ")}</p>
          ) : null}
          {state.errors.filter((error) => error !== state.message).length > 0 ? (
            <ul className="space-y-1 text-accent">
              {state.errors
                .filter((error) => error !== state.message)
                .map((error) => (
                  <li key={error}>{error}</li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
