"use client";

import { useState } from "react";
import { saveProduct } from "@/app/admin/products/actions";
import { Button } from "@/components/ui/button";
import type { Category, ProductDetail } from "@/server/catalog/types";

type ColorRow = { id?: string; name: string; hex: string; stock: number };

function ColorOptionsEditor({ product }: { product?: ProductDetail }) {
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
    <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
      <h2 className="font-serif text-xl">Colours</h2>
      <p className="text-sm text-muted">
        Add a row for each colour on the shelf. The hex is the swatch customers see. One photograph still stands for the
        listing until you upload a shot per colour.
      </p>
      <input type="hidden" name="colorsPresent" value="1" />
      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.id ?? `new-${index}`} className="grid gap-2 sm:grid-cols-[1fr_auto_5rem_auto]">
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
              {index === 0 ? "Swatch" : <span className="sr-only">Swatch</span>}
              <input
                name="colorHex"
                type="color"
                value={/^#([0-9a-f]{6})$/i.test(row.hex) ? row.hex : "#888888"}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = { ...row, hex: event.target.value };
                  setRows(next);
                }}
                className="mt-1 h-11 w-14 cursor-pointer border border-border bg-surface p-1"
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
              className="self-end pb-2 text-sm text-muted"
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="text-sm text-accent"
        onClick={() => setRows([...rows, { name: "", hex: "#c8102e", stock: 0 }])}
      >
        Add colour
      </button>
    </section>
  );
}

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductDetail;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const specText = product
    ? Object.entries(product.specifications)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";
  return (
    <form
      className="mt-8 max-w-2xl space-y-8"
      onSubmit={async (event) => {
        event.preventDefault();
        await saveProduct(new FormData(event.currentTarget));
        setMessage("Saved.");
      }}
    >
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Listing</h2>
        <label className="block text-sm">
          Name
          <input required name="name" defaultValue={product?.name} className="input mt-1" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            SKU
            <input required name="sku" defaultValue={product?.sku} className="input mt-1" />
          </label>
          <label className="block text-sm">
            Slug
            <input name="slug" defaultValue={product?.slug} className="input mt-1" />
          </label>
        </div>
        <label className="block text-sm">
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
        <label className="block text-sm">
          Description
          <textarea name="description" defaultValue={product?.description} rows={6} className="input mt-1" />
        </label>
      </section>
      <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Price and stock</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Price (GHS)
            <input required name="price" type="number" step="0.01" defaultValue={product?.price} className="input mt-1" />
          </label>
          <label className="block text-sm">
            Sale price (optional)
            <input name="salePrice" type="number" step="0.01" defaultValue={product?.salePrice ?? ""} className="input mt-1" />
          </label>
        </div>
        <p className="text-xs text-muted">
          A sale price below the regular price puts the piece on the homepage promo and the On promo list. Leave blank
          when it is not discounted.
        </p>
        {!product ? (
          <label className="block text-sm">
            Initial stock
            <input name="initialStock" type="number" defaultValue={0} className="input mt-1" />
          </label>
        ) : null}
        <label className="block text-sm">
          Specifications (one per line, Name: value)
          <textarea name="specifications" defaultValue={specText} rows={4} className="input mt-1" />
        </label>
      </section>
      <ColorOptionsEditor product={product} />
      <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Visibility</h2>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={product?.isActive} /> Visible in shop
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} /> Featured
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} /> New arrival
        </label>
        <label className="block text-sm">
          SEO title
          <input name="seoTitle" defaultValue={product?.seoTitle ?? ""} className="input mt-1" />
        </label>
        <label className="block text-sm">
          SEO description
          <textarea name="seoDescription" defaultValue={product?.seoDescription ?? ""} className="input mt-1" />
        </label>
      </section>
      <Button type="submit">Save product</Button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
