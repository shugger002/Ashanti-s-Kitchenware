export function isDemoListing(sku?: string | null, slug?: string | null) {
  return Boolean(sku?.toUpperCase().startsWith("DEMO-") || slug?.toLowerCase().startsWith("demo-"));
}
