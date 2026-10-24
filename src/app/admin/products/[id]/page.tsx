import { notFound } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";
import { ProductForm } from "@/components/admin/product-form";
import {
  archiveProductAction,
  deleteProductImageAction,
  setProductImagePrimaryAction,
  setReviewPublishedAction,
} from "@/app/admin/products/actions";
import { requirePermission } from "@/server/auth/authorize";
import { listCategories, getProductById } from "@/server/catalog/queries";
import { adminButton, AdminGlance, AdminPageHeader, AdminSection, BackLink, StatusPill } from "@/components/admin/ui";
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
        description={`Sheet code ${product.sku}`}
        action={
          <span className="flex flex-wrap gap-1">
            <StatusPill value={product.isActive ? "On the shop" : "Hidden"} tone={product.isActive ? "ok" : "muted"} />
            {product.isFeatured ? <StatusPill value="On homepage" tone="attention" /> : null}
          </span>
        }
      />
      <AdminGlance
        className="mt-6 max-w-3xl"
        items={[
          { href: "/admin/inventory", label: "To sell", value: product.available, warn: product.available <= product.lowStockThreshold },
          { label: "Photos", value: product.images.length, warn: product.images.length === 0 },
          { label: "Shop", value: product.isActive ? "On the shop" : "Hidden", warn: !product.isActive },
        ]}
      />
      <AdminSection className="mt-8 max-w-3xl" title="Photos" hint="The main photo is what customers see first.">
        {product.images.length === 0 ? (
          <p className="text-sm text-muted">No photos yet. Add a picture of the piece on the shelf.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {product.images.map((image) => (
              <li key={image.id} className="overflow-hidden border border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt} className="aspect-square w-full object-cover" />
                <p className="truncate px-2 pt-1.5 text-[11px] text-muted">
                  {image.isPrimary ? "Main photo · " : ""}
                  {image.alt || "Untitled"}
                </p>
                <div className="flex flex-wrap gap-x-3 px-2 pb-2 text-xs">
                  {image.isPrimary ? null : (
                    <form action={setProductImagePrimaryAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="imageId" value={image.id} />
                      <button type="submit" className="inline-flex min-h-11 items-center text-accent">
                        Make main
                      </button>
                    </form>
                  )}
                  <form action={deleteProductImageAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <button type="submit" className="inline-flex min-h-11 items-center text-muted hover:text-accent">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <ImageUpload productId={product.id} productName={product.name} />
      </AdminSection>
      <ProductForm categories={categories} product={product} />
      <AdminSection
        className="mt-8 max-w-3xl"
        title="Reviews"
        hint="Publish only reviews that look like a real customer’s experience."
      >
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">None submitted.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
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
      </AdminSection>
      <form action={archiveProductAction} className="mt-10 max-w-2xl">
        <input type="hidden" name="id" value={product.id} />
        <button type="submit" className="text-sm text-accent">
          Remove from the shop
        </button>
      </form>
    </div>
  );
}
