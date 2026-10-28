"use client";

import { useState } from "react";
import { type ProductCsvResult } from "@/lib/desk-import";
import { loadContainerStock } from "@/app/admin/products/csv-actions";
import { downloadDeskFile, postDeskForm } from "@/components/admin/desk-file";
import { adminButton, AdminSection } from "@/components/admin/ui";

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
    <AdminSection
      title="Add many at once"
      hint="Load the container list, or upload a CSV, Excel file, or PDF with names, codes, and Ghana Cedi prices. Photos can wait. If you add photos now, name the files with the code, like APA-126.jpg."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-sm border border-[color-mix(in_srgb,var(--accent)_14%,#eadfd4)] bg-white p-4">
          <p className="font-serif text-lg">From this shop’s list</p>
          <p className="mt-1 text-sm text-muted">Puts the current container pieces on the shop.</p>
          <button
            type="button"
            className={`${adminButton()} mt-4`}
            disabled={pending}
            onClick={() => {
              setPending(true);
              void loadContainerStock()
                .then((result) => setState(result))
                .finally(() => setPending(false));
            }}
          >
            {pending ? "Loading list…" : "Load container list"}
          </button>
        </div>
        <div className="rounded-sm border border-[color-mix(in_srgb,var(--accent)_14%,#eadfd4)] bg-white p-4">
          <p className="font-serif text-lg">From a file</p>
          <p className="mt-1 text-sm text-muted">CSV, Excel, or a PDF table of names, codes, prices, and quantities.</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-accent underline-offset-2 hover:underline"
            onClick={() => downloadDeskFile("/api/admin/products-template")}
          >
            Download a sample spreadsheet
          </button>
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
            <label className="block text-sm">
              CSV, Excel, or PDF
              <input
                name="file"
                type="file"
                accept=".csv,.xlsx,.xls,.ods,.pdf,text/csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="admin-file mt-1"
              />
            </label>
            <label className="block text-sm">
              Photos
              <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="admin-file mt-1" />
            </label>
            <button className={adminButton()} type="submit" disabled={pending}>
              {pending ? "Reading file…" : "Add from file"}
            </button>
          </form>
        </div>
      </div>
      {state ? (
        <div className="mt-5 space-y-2 border-t border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] pt-4 text-sm">
          <p className={state.ok ? "font-medium" : "text-accent"}>{state.message}</p>
          {state.created.length > 0 ? <p className="text-muted">Added: {state.created.join(", ")}</p> : null}
          {state.skipped.length > 0 ? <p className="text-muted">Already on the desk: {state.skipped.join(", ")}</p> : null}
          {state.attached.length > 0 ? <p className="text-muted">Photos: {state.attached.join("; ")}</p> : null}
          {state.unmatched.length > 0 ? (
            <p className="text-accent">These photo names did not match a code: {state.unmatched.join(", ")}</p>
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
    </AdminSection>
  );
}
