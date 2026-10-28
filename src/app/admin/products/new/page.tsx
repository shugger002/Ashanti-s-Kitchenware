import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
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
        description="Name it, price it in Cedis, and say how many are on the shelf. Photos can wait."
      />
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        To change a piece that is already on the desk, open{" "}
        <Link href="/admin/products" className="text-accent">
          Edit products
        </Link>
        . To load the whole container list, use that same list.
      </p>
      <ProductForm categories={categories} error={error} />
    </div>
  );
}
