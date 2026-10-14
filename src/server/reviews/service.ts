import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { writeAuditLog } from "@/server/auth/audit";

export type ProductReview = {
  id: string;
  displayName: string;
  body: string;
  rating: number;
  createdAt: string;
  isPublished?: boolean;
};

export async function listPublishedReviews(productId: string): Promise<ProductReview[]> {
  try {
    const result = await query<{
      id: string;
      display_name: string;
      body: string;
      rating: number;
      created_at: Date;
    }>(sql`
      SELECT id, display_name, body, rating, created_at
       FROM product_reviews
       WHERE product_id = ${productId} AND is_published = TRUE
       ORDER BY created_at DESC
       LIMIT 50
    `);
    return result.rows.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      body: row.body,
      rating: row.rating,
      createdAt: row.created_at.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function listProductReviewsForAdmin(productId: string): Promise<ProductReview[]> {
  const result = await query<{
    id: string;
    display_name: string;
    body: string;
    rating: number;
    created_at: Date;
    is_published: boolean;
  }>(sql`
    SELECT id, display_name, body, rating, created_at, is_published
     FROM product_reviews
     WHERE product_id = ${productId}
     ORDER BY created_at DESC
     LIMIT 100
  `);
  return result.rows.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    body: row.body,
    rating: row.rating,
    createdAt: row.created_at.toISOString(),
    isPublished: row.is_published,
  }));
}

export async function submitReview(input: {
  productId: string;
  displayName: string;
  body: string;
  rating: number;
  attested: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.attested) {
    return { ok: false, error: "Confirm that this is your own experience of the item." };
  }
  const name = input.displayName.trim();
  const body = input.body.trim();
  const rating = Number(input.rating);
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (body.length < 10) return { ok: false, error: "Write a short review of at least 10 characters." };
  if (rating < 1 || rating > 5) return { ok: false, error: "Choose a rating from 1 to 5." };
  try {
    await query(sql`
      INSERT INTO product_reviews (product_id, display_name, body, rating, is_published)
       VALUES (${input.productId}, ${name.slice(0, 80)}, ${body.slice(0, 2000)}, ${rating}, FALSE)
    `);
    return { ok: true };
  } catch {
    return { ok: false, error: "Reviews are available after this product is saved in the catalogue." };
  }
}

export async function setReviewPublished(input: {
  reviewId: string;
  published: boolean;
  actorUserId: string;
}): Promise<void> {
  await query(sql`UPDATE product_reviews SET is_published = ${input.published} WHERE id = ${input.reviewId}`);
  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: input.published ? "review.publish" : "review.unpublish",
    entityType: "product_review",
    entityId: input.reviewId,
    metadata: {},
  });
}
