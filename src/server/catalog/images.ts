import { addProductImage } from "@/server/catalog/admin";
import { matchProductFromFilename, photoUploadPlan } from "@/server/catalog/image-names";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { sniffImageType } from "@/lib/secrets";
import { isUuid } from "@/lib/utils";
import { assertImageUpload, extensionForType, getStorage, randomObjectKey } from "@/server/storage";

export async function saveProductPhoto(input: {
  productId: string;
  file: File;
  alt: string;
  isPrimary: boolean;
  replacePrimary?: boolean;
}): Promise<void> {
  if (!isUuid(input.productId)) throw new Error("Choose a photo first.");
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) throw new Error("Only JPEG, PNG, and WebP images are allowed");
  assertImageUpload({ type, size: input.file.size });
  let alt = input.alt.trim();
  if (!alt) {
    const named = await query<{ name: string }>(sql`SELECT name FROM products WHERE id = ${input.productId} LIMIT 1`);
    alt = named.rows[0]?.name?.trim() || "Product photo";
  }
  const stored = await getStorage().put({
    bytes,
    contentType: type,
    key: randomObjectKey(extensionForType(type)),
  });
  await addProductImage({
    productId: input.productId,
    url: stored.url,
    storageKey: stored.key,
    alt,
    isPrimary: input.isPrimary,
    replacePrimary: input.replacePrimary,
  });
}

export async function attachPhotosBySku(files: File[]): Promise<{
  attached: string[];
  unmatched: string[];
  errors: string[];
  published: string[];
}> {
  const usable = files.filter((file) => file instanceof File && file.size > 0);
  const attached: string[] = [];
  const unmatched: string[] = [];
  const errors: string[] = [];
  const published: string[] = [];
  if (usable.length === 0) return { attached, unmatched, errors, published };

  const products = await query<{ id: string; sku: string; name: string; image_count: string }>(sql`
    SELECT p.id, p.sku, p.name,
            (SELECT count(*)::text FROM product_images pi WHERE pi.product_id = p.id) AS image_count
     FROM products p
     WHERE p.archived_at IS NULL
  `);
  const bySku = new Map(products.rows.map((row) => [row.sku.toLowerCase(), row]));
  const grouped = new Map<string, File[]>();

  for (const file of usable) {
    const match = matchProductFromFilename(file.name, products.rows);
    if (!match) {
      unmatched.push(file.name);
      continue;
    }
    const list = grouped.get(match.sku.toLowerCase()) ?? [];
    list.push(file);
    grouped.set(match.sku.toLowerCase(), list);
  }

  for (const [skuKey, skuFiles] of grouped) {
    const product = bySku.get(skuKey);
    if (!product) continue;
    const sorted = [...skuFiles].sort((a, b) => a.name.localeCompare(b.name));
    const existingCount = Number(product.image_count);
    const plan = photoUploadPlan(sorted.map((file) => file.name), product, existingCount);
    let storedOne = false;
    for (const step of plan) {
      const file = sorted[step.index];
      if (!file) continue;
      try {
        await saveProductPhoto({
          productId: product.id,
          file,
          alt: product.name,
          isPrimary: step.isPrimary,
          replacePrimary: step.replacePrimary,
        });
        storedOne = true;
        attached.push(`${product.sku} ← ${file.name}`);
      } catch (error) {
        errors.push(
          `${file.name}: ${error instanceof Error ? error.message : "Could not store photograph."}`,
        );
      }
    }
    if (storedOne && existingCount === 0) {
      const shown = await query<{ id: string }>(sql`
        UPDATE products
           SET is_active = TRUE, updated_at = now()
         WHERE id = ${product.id}
           AND archived_at IS NULL
           AND is_active = FALSE
        RETURNING id
      `);
      if (shown.rows[0]) published.push(product.sku);
    }
  }
  return { attached, unmatched, errors, published };
}
