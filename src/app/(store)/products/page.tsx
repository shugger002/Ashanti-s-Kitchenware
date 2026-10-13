import { pageMeta } from "@/lib/seo";
import { CatalogPage } from "@/components/store/catalog-page";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Store",
  description: "Browse Ashanti's Kitchenware cookware, appliances, and household essentials in Ghana Cedis.",
  path: "/products",
});

type Search = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  stock?: string;
  sort?: string;
  page?: string;
  featured?: string;
  new?: string;
  sale?: string;
};

export default async function ProductsIndexPage({ searchParams }: { searchParams: Promise<Search> }) {
  return <CatalogPage params={await searchParams} basePath="/products" />;
}
