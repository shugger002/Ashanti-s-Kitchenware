import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/store/product-grid";
import { pageMeta } from "@/lib/seo";
import { getCategoryBySlug, searchProducts } from "@/server/catalog/queries";

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
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();
  const { items, total } = await searchProducts({ category: cat.slug, pageSize: 24 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12">
      <nav className="text-sm text-muted">
        <Link href="/products">Store</Link> / <span>{cat.name}</span>
      </nav>
      <h1 className="mt-5 text-4xl">{cat.name}</h1>
      {cat.description ? <p className="mt-3 max-w-2xl text-muted">{cat.description}</p> : null}
      <p className="mt-4 text-sm text-muted">{total} products</p>
      {items.length === 0 ? (
        <p className="mt-12 text-muted">Nothing published in this category yet.</p>
      ) : (
        <div className="mt-10">
          <ProductGrid products={items} />
        </div>
      )}
    </div>
  );
}
