import { addProductImage } from "@/server/catalog/admin";
import { matchProductFromFilename } from "@/server/catalog/image-names";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { assertImageUpload, extensionForType, getStorage, randomObjectKey } from "@/server/storage";
import { ALLOWED_IMAGE_TYPES } from "@/server/storage/port";

function mimeFromFile(file: File): string {
  if (ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return file.type;
}

export async function saveProductPhoto(input: {
  productId: string;
  file: File;
  alt: string;
  isPrimary: boolean;
}): Promise<void> {
  const type = mimeFromFile(input.file);
  assertImageUpload({ type, size: input.file.size });
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const stored = await getStorage().put({
    bytes,
    contentType: type,
    key: randomObjectKey(extensionForType(type)),
  });
  await addProductImage({
    productId: input.productId,
    url: stored.url,
    storageKey: stored.key,
    alt: input.alt,
    isPrimary: input.isPrimary,
  });
}

export async function attachPhotosBySku(files: File[]): Promise<{ attached: string[]; unmatched: string[]; errors: string[] }> {
  const usable = files.filter((file) => file instanceof File && file.size > 0);
  const attached: string[] = [];
  const unmatched: string[] = [];
  const errors: string[] = [];
  if (usable.length === 0) return { attached, unmatched, errors };

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
    let hasPrimary = Number(product.image_count) > 0;
    for (const file of sorted) {
      try {
        await saveProductPhoto({
          productId: product.id,
          file,
          alt: product.name,
          isPrimary: !hasPrimary,
        });
        hasPrimary = true;
        attached.push(`${product.sku} ← ${file.name}`);
      } catch (error) {
        errors.push(
          `${file.name}: ${error instanceof Error ? error.message : "Could not store photograph."}`,
        );
      }
    }
  }
  return { attached, unmatched, errors };
}
