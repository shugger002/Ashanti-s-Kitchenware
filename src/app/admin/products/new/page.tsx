import { ProductForm } from "@/components/admin/product-form";
import { ProductCsvForm } from "@/app/admin/products/csv-form";
import { requirePermission } from "@/server/auth/authorize";
import { listCategories } from "@/server/catalog/queries";
import { AdminPageHeader, BackLink } from "@/components/admin/ui";

export default async function NewProductPage() {
  await requirePermission("products.write");
  const categories = await listCategories(false);
  return (
    <div>
      <BackLink href="/admin/products">All products</BackLink>
      <AdminPageHeader title="Add a product" description="Add one piece, or load the whole container list at once." />
      <div className="mt-6">
        <ProductCsvForm />
      </div>
      <div className="mt-8">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
