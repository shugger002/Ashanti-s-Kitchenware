import type { MetadataRoute } from "next";
import { getAppUrl } from "@/server/env";
import { listCategories, searchProducts } from "@/server/catalog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const staticPaths = [
    "",
    "/shop",
    "/products",
    "/promo",
    "/orders/track",
    "/search",
    "/about",
    "/contact",
    "/directions",
    "/journal",
    "/faq",
    "/privacy",
    "/terms",
    "/refunds",
    "/cookies",
  ];
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let products: Awaited<ReturnType<typeof searchProducts>> = { items: [], total: 0, page: 1, pageSize: 12 };
  try {
    categories = await listCategories();
    products = await searchProducts({ pageSize: 48 });
  } catch {
    // Database may be unavailable during CI image builds.
  }
  return [
    ...staticPaths.map((path) => ({ url: `${base}${path || "/"}`, changeFrequency: "weekly" as const })),
    ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, changeFrequency: "weekly" as const })),
    ...products.items.map((p) => ({ url: `${base}/products/${p.slug}`, changeFrequency: "weekly" as const })),
    { url: `${base}/journal/how-to-build-your-first-cookware-set`, changeFrequency: "monthly" as const },
    { url: `${base}/journal/essential-tools-every-home-cook-needs`, changeFrequency: "monthly" as const },
    { url: `${base}/journal/how-to-care-for-wooden-kitchen-utensils`, changeFrequency: "monthly" as const },
  ];
}
