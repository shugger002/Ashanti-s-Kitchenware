import { slugify } from "@/lib/utils";

export function filenameBase(name: string) {
  return name.replace(/\.[^.]+$/, "").trim();
}

export function matchSkuFromFilename(filename: string, skus: string[]): string | null {
  const base = filenameBase(filename).toLowerCase();
  if (!base) return null;
  const exact = skus.find((sku) => sku.toLowerCase() === base);
  if (exact) return exact;
  const prefixed = skus
    .filter((sku) => base.startsWith(`${sku.toLowerCase()}-`) || base.startsWith(`${sku.toLowerCase()}_`))
    .sort((a, b) => b.length - a.length);
  return prefixed[0] ?? null;
}

export function matchNameFromFilename(filename: string, names: string[]): string | null {
  const slug = slugify(filenameBase(filename));
  if (!slug) return null;
  const keyed = names.map((name) => ({ name, slug: slugify(name) })).filter((row) => row.slug);
  const exact = keyed.filter((row) => row.slug === slug);
  if (exact.length === 1) return exact[0].name;
  if (exact.length > 1) return null;
  const prefixed = keyed
    .filter((row) => slug.startsWith(`${row.slug}-`))
    .sort((a, b) => b.slug.length - a.slug.length);
  if (prefixed.length === 0) return null;
  const best = prefixed[0].slug;
  const tied = prefixed.filter((row) => row.slug === best);
  return tied.length === 1 ? tied[0].name : null;
}

export function matchProductFromFilename(
  filename: string,
  products: { sku: string; name: string }[],
): { sku: string } | null {
  const sku = matchSkuFromFilename(
    filename,
    products.map((product) => product.sku),
  );
  if (sku) return { sku };
  const name = matchNameFromFilename(
    filename,
    products.map((product) => product.name),
  );
  if (!name) return null;
  const matches = products.filter((product) => product.name.toLowerCase() === name.toLowerCase());
  return matches.length === 1 ? { sku: matches[0].sku } : null;
}
