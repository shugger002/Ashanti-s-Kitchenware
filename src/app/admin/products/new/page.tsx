import Link from "next/link";
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
      <AdminPageHeader
        title="Add a product"
        description="Name it, price it in Cedis, and say how many are on the shelf. Photos can wait."
      />
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        To load the whole container list, use{" "}
        <Link href="/admin/products" className="text-accent">
          All products
        </Link>
        .
      </p>
      <ProductForm categories={categories} />
    </div>
  );
}
