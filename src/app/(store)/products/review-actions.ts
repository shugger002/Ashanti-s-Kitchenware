"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { submitReview } from "@/server/reviews/service";
import { hitRateLimit } from "@/server/auth/rate-limit";
import { clientIp } from "@/server/http/client-ip";

export async function createProductReview(formData: FormData) {
  if (String(formData.get("company") ?? "")) {
    return { ok: true as const };
  }
  const productId = String(formData.get("productId") ?? "");
  if (!z.string().uuid().safeParse(productId).success) {
    return { ok: false as const, error: "This product cannot take a review." };
  }
  const ip = clientIp(await headers());
  if (await hitRateLimit(`review:${ip ?? "unknown"}`, 8, ip)) {
    return { ok: false as const, error: "Too many reviews from this connection. Try again later." };
  }
  const result = await submitReview({
    productId,
    displayName: String(formData.get("displayName") ?? ""),
    body: String(formData.get("body") ?? ""),
    rating: Number(formData.get("rating") ?? 0),
    attested: formData.get("attested") === "on" || formData.get("attested") === "true",
  });
  if (result.ok) {
    const slug = String(formData.get("slug") ?? "");
    if (slug) revalidatePath(`/products/${slug}`);
  }
  return result;
}
