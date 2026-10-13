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
