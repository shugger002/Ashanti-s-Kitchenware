import { pageMeta } from "@/lib/seo";
import { CategoryBrowse } from "@/components/store/category-browse";
import type { CatalogSearch } from "@/components/store/catalog-page";

export const metadata = pageMeta({
  title: "Store",
  description: "Browse kitchen appliances from Ashanti's Kitchenware in Accra, priced in Ghana Cedis.",
  path: "/shop",
});

export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogSearch> }) {
  return <CategoryBrowse params={await searchParams} />;
}
