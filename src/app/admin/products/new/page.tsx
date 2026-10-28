import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { ProductCsvForm } from "@/app/admin/products/csv-form";
import { requirePermission } from "@/server/auth/authorize";
import { listCategories } from "@/server/catalog/queries";
import { AdminPageHeader, BackLink } from "@/components/admin/ui";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("products.write");
  const { error } = await searchParams;
  const categories = await listCategories(false);
  return (
    <div>
      <BackLink href="/admin/products">All products</BackLink>
      <AdminPageHeader
        title="Add a product"
        description="Add one piece below, or load many from a CSV, Excel file, or PDF."
      />
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        To change a piece that is already on the desk, open{" "}
        <Link href="/admin/products" className="text-accent">
          Edit products
        </Link>
        .
      </p>
      <div id="add-many" className="mt-8">
        <ProductCsvForm />
      </div>
      <ProductForm categories={categories} error={error} />
    </div>
  );
}
