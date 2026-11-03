import { notFound } from "next/navigation";
import { CategoryBrowse } from "@/components/store/category-browse";
import type { CatalogSearch } from "@/components/store/catalog-page";
import { pageMeta } from "@/lib/seo";
import { getCategoryBySlug } from "@/server/catalog/queries";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return pageMeta({ title: "Category", description: "Category not found", path: `/shop/${category}` });
  return pageMeta({
    title: cat.name,
    description: cat.description || `Shop ${cat.name} at Ashanti's Kitchenware.`,
    path: `/shop/${cat.slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<CatalogSearch>;
}) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();
  const query = await searchParams;
  return <CategoryBrowse params={{ ...query, category: cat.slug }} />;
}
