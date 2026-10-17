"use client";

import { useState } from "react";
import { saveProduct } from "@/app/admin/products/actions";
import { Button } from "@/components/ui/button";
import { AdminSection } from "@/components/admin/ui";
import type { Category, ProductDetail } from "@/server/catalog/types";

type ColorRow = { id?: string; name: string; hex: string; stock: number };

function ColorOptionsEditor({ product, step }: { product?: ProductDetail; step: string }) {
  const [rows, setRows] = useState<ColorRow[]>(
    () =>
      product?.variants.map((variant) => ({
        id: variant.id,
        name: variant.attributes.color || variant.name,
        hex: variant.attributes.hex || "#888888",
        stock: variant.onHand,
      })) ?? [],
  );

  return (
    <AdminSection
      step={step}
      title="Colours"
      hint="Add each colour you have in stock. The colour box is what shoppers tap. One photo is enough until you add a picture per colour."
    >
      <input type="hidden" name="colorsPresent" value="1" />
      {rows.length === 0 ? (
        <p className="mb-4 text-sm text-muted">No colours yet. Add one if the piece comes in more than one finish.</p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li
            key={row.id ?? `new-${index}`}
            className="grid gap-2 rounded-sm border border-[color-mix(in_srgb,var(--accent)_10%,#eadfd4)] bg-white p-3 sm:grid-cols-[1fr_auto_5rem_auto]"
          >
            <input type="hidden" name="colorId" value={row.id || ""} />
            <label className="block text-sm sm:col-span-1">
              {index === 0 ? "Name" : <span className="sr-only">Colour name</span>}
              <input
                name="colorName"
                value={row.name}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = { ...row, name: event.target.value };
                  setRows(next);
                }}
                className="input mt-1"
                placeholder="Navy"
              />
            </label>
            <label className="block text-sm">
              {index === 0 ? "Colour" : <span className="sr-only">Colour</span>}
              <input
                name="colorHex"
                type="color"
                value={/^#([0-9a-f]{6})$/i.test(row.hex) ? row.hex : "#888888"}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = { ...row, hex: event.target.value };
                  setRows(next);
                }}
                className="mt-1 h-11 w-14 cursor-pointer border border-border bg-white p-1"
              />
            </label>
            <label className="block text-sm">
              {index === 0 ? "Stock" : <span className="sr-only">Stock</span>}
              <input
                name="colorStock"
                type="number"
                min={0}
                value={row.stock}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = { ...row, stock: Number(event.target.value) };
                  setRows(next);
                }}
                className="input mt-1"
              />
            </label>
            <button
              type="button"
              className="self-end pb-2 text-sm text-accent"
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-4 text-sm font-medium text-accent"
        onClick={() => setRows([...rows, { name: "", hex: "#c8102e", stock: 0 }])}
      >
        Add colour
      </button>
    </AdminSection>
  );
}

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductDetail;
}) {
  const specText = product
    ? Object.entries(product.specifications)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";
  return (
    <form action={saveProduct} className="mt-8 max-w-3xl space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <AdminSection
        step="01"
        title="What is this piece?"
        hint="Name it the way you would say it across the counter."
      >
        <label className="block text-sm">
          Name
          <input required name="name" defaultValue={product?.name} className="input mt-1" />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Sheet code
            <span className="mt-0.5 block text-xs text-muted">The code on your container list, like APA-126.</span>
            <input required name="sku" defaultValue={product?.sku} className="input mt-1" />
          </label>
          <label className="block text-sm">
            Shop page address
            <span className="mt-0.5 block text-xs text-muted">Leave blank. We will make one from the name.</span>
            <input name="slug" defaultValue={product?.slug} className="input mt-1" />
          </label>
        </div>
        <label className="mt-4 block text-sm">
          Category
          <select name="categoryId" defaultValue={product?.categoryId ?? ""} className="input mt-1">
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm">
          Description
          <span className="mt-0.5 block text-xs text-muted">What you would tell a customer in the shop.</span>
          <textarea name="description" defaultValue={product?.description} rows={6} className="input mt-1" />
        </label>
      </AdminSection>
      <AdminSection step="02" title="Price and stock" hint="Prices in Ghana Cedis. Sale price is optional.">
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            Price (GH₵)
            <input required name="price" type="number" step="0.01" defaultValue={product?.price} className="input mt-1" />
          </label>
          <label className="block text-sm">
            Sale price
            <span className="mt-0.5 block text-xs text-muted">Leave empty if it is not on promo.</span>
            <input name="salePrice" type="number" step="0.01" defaultValue={product?.salePrice ?? ""} className="input mt-1" />
          </label>
        </div>
        {!product ? (
          <label className="mt-4 block text-sm">
            How many on the shelf
            <input name="initialStock" type="number" defaultValue={0} className="input mt-1" />
          </label>
        ) : null}
        <label className="mt-4 block text-sm">
          Extra details
          <span className="mt-0.5 block text-xs text-muted">One per line, like Size: 32cm</span>
          <textarea name="specifications" defaultValue={specText} rows={4} className="input mt-1" />
        </label>
      </AdminSection>
      {!product ? (
        <AdminSection step="03" title="Photos" hint="The first picture is the main one. You can add more after you save.">
          <label className="admin-drop">
            <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" />
            <span className="font-serif text-lg">Drop photos here, or tap to choose</span>
            <span className="text-xs text-muted">JPEG, PNG, or WebP. 6 MB each.</span>
          </label>
        </AdminSection>
      ) : null}
      <ColorOptionsEditor product={product} step={product ? "03" : "04"} />
      <AdminSection step={product ? "04" : "05"} title="On the shop" hint="Tick what customers should see.">
        <div className="divide-y divide-[color-mix(in_srgb,var(--accent)_10%,#eadfd4)]">
          <label className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm">
            Show on the shop
            <input type="checkbox" name="isActive" defaultChecked={product ? product.isActive : true} className="size-5 accent-[#c8102e]" />
          </label>
          <label className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm">
            Show on the homepage
            <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} className="size-5 accent-[#c8102e]" />
          </label>
          <label className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm">
            Mark as new
            <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="size-5 accent-[#c8102e]" />
          </label>
        </div>
        <label className="mt-4 block text-sm">
          Google title
          <span className="mt-0.5 block text-xs text-muted">Optional. Leave blank to use the product name.</span>
          <input name="seoTitle" defaultValue={product?.seoTitle ?? ""} className="input mt-1" />
        </label>
        <label className="mt-4 block text-sm">
          Google description
          <span className="mt-0.5 block text-xs text-muted">Optional. A short line Google can show.</span>
          <textarea name="seoDescription" defaultValue={product?.seoDescription ?? ""} className="input mt-1" />
        </label>
      </AdminSection>
      <div className="admin-save">
        <Button type="submit" className="h-12 w-full sm:w-auto">
          {product ? "Save changes" : "Save product"}
        </Button>
      </div>
    </form>
  );
}
