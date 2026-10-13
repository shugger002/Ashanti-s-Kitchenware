import { ProductForm } from "@/components/admin/product-form";
import { requirePermission } from "@/server/auth/authorize";
import { listCategories } from "@/server/catalog/queries";
import { AdminPageHeader, BackLink } from "@/components/admin/ui";

export default async function NewProductPage() {
  await requirePermission("products.write");
  const categories = await listCategories(false);
  return (
    <div>
      <BackLink href="/admin/products">All products</BackLink>
      <AdminPageHeader title="New product" description="Add a photographed piece with a Ghana Cedi price." />
      <ProductForm categories={categories} />
    </div>
  );
}
