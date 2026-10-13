import { notFound } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";
import { ProductForm } from "@/components/admin/product-form";
import { archiveProductAction, setReviewPublishedAction } from "@/app/admin/products/actions";
import { requirePermission } from "@/server/auth/authorize";
import { listCategories, getProductById } from "@/server/catalog/queries";
import { adminButton, AdminPageHeader, BackLink, StatusPill } from "@/components/admin/ui";
import { listProductReviewsForAdmin } from "@/server/reviews/service";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("products.write");
  const { id } = await params;
  const [product, categories, reviews] = await Promise.all([
    getProductById(id),
    listCategories(false),
    listProductReviewsForAdmin(id).catch(() => []),
  ]);
  if (!product) notFound();
  return (
    <div>
      <BackLink href="/admin/products">All products</BackLink>
      <AdminPageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        action={
          <span className="flex flex-wrap gap-1">
            <StatusPill value={product.isActive ? "Listed" : "Hidden"} tone={product.isActive ? "ok" : "muted"} />
            {product.isFeatured ? <StatusPill value="Featured" tone="attention" /> : null}
          </span>
        }
      />
      <ProductForm categories={categories} product={product} />
      <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Photographs</h2>
        {product.images.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No photographs yet. Upload what is on the shelf.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {product.images.map((image) => (
              <li key={image.id} className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt} className="aspect-square w-full object-cover" />
                <p className="truncate px-2 py-1.5 text-[11px] text-muted">
                  {image.isPrimary ? "Primary · " : ""}
                  {image.alt || "Untitled"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <ImageUpload productId={product.id} />
      </section>
      <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Reviews</h2>
        <p className="mt-2 text-sm text-muted">Publish only reviews that look like a real customer’s experience.</p>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted">None submitted.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border text-sm">
            {reviews.map((review) => (
              <li key={review.id} className="space-y-2 py-3">
                <p className="font-medium">
                  {review.displayName} · {review.rating}/5 · {review.isPublished ? "Published" : "Held"}
                </p>
                <p className="text-muted">{review.body}</p>
                <form action={setReviewPublishedAction}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="published" value={review.isPublished ? "false" : "true"} />
                  <button className={adminButton("px-3 py-2")} type="submit">
                    {review.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <form action={archiveProductAction} className="mt-10 max-w-2xl">
        <input type="hidden" name="id" value={product.id} />
        <button type="submit" className="text-sm text-accent">
          Archive product
        </button>
      </form>
    </div>
  );
}
