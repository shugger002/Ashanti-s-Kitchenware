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
  const productPaths: string[] = [];
  try {
    categories = await listCategories();
    for (let page = 1; page <= 20; page += 1) {
      const batch = await searchProducts({ page, pageSize: 48 });
      for (const product of batch.items) productPaths.push(product.slug);
      if (batch.items.length < 48 || page * 48 >= batch.total) break;
    }
  } catch {
    // Database may be unavailable during CI image builds.
  }
  return [
    ...staticPaths.map((path) => ({ url: `${base}${path || "/"}`, changeFrequency: "weekly" as const })),
    ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, changeFrequency: "weekly" as const })),
    ...productPaths.map((slug) => ({ url: `${base}/products/${slug}`, changeFrequency: "weekly" as const })),
    { url: `${base}/journal/how-to-build-your-first-cookware-set`, changeFrequency: "monthly" as const },
    { url: `${base}/journal/essential-tools-every-home-cook-needs`, changeFrequency: "monthly" as const },
    { url: `${base}/journal/how-to-care-for-wooden-kitchen-utensils`, changeFrequency: "monthly" as const },
  ];
}
