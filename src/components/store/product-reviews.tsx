"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProductReview } from "@/app/(store)/products/review-actions";
import type { ProductReview } from "@/server/reviews/service";

export function ProductReviews({
  productId,
  slug,
  reviews,
  allowSubmit = true,
}: {
  productId: string;
  slug: string;
  reviews: ProductReview[];
  allowSubmit?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="text-2xl">Customer reviews</h2>
      <p className="mt-2 text-sm text-muted">
        Published reviews are customer submissions the shop has accepted. They are not independently verified purchases.
      </p>
      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No published reviews yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-border py-4 text-sm">
              <p className="font-medium">
                {review.displayName} · {review.rating}/5
              </p>
              <p className="mt-2 text-muted">{review.body}</p>
            </li>
          ))}
        </ul>
      )}
      {allowSubmit ? (
      <form
        className="mt-8 max-w-lg space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await createProductReview(new FormData(event.currentTarget));
          if (!result.ok) {
            setError("error" in result ? result.error : "Could not save review.");
            return;
          }
          setDone(true);
          setError(null);
          router.refresh();
        }}
      >
        <h3 className="font-medium">Write a review</h3>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="slug" value={slug} />
        <p className="sr-only" aria-hidden="true">
          <label>
            Company
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </p>
        <label className="block text-sm">
          Name
          <input name="displayName" required className="input mt-1" />
        </label>
        <label className="block text-sm">
          Rating
          <select name="rating" required defaultValue="" className="input mt-1">
            <option value="" disabled>
              Choose a rating
            </option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Review
          <textarea name="body" required minLength={10} rows={4} className="input mt-1" />
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="attested" required />
          I confirm this is my own experience of the item, not a paid or invented review.
        </label>
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        {done ? (
          <p className="text-sm text-muted">Thank you. The shop will read it before it appears on this page.</p>
        ) : null}
        <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white dark:text-background">
          Submit review
        </button>
      </form>
      ) : null}
    </section>
  );
}
