import { ASANTE_CONTAINER_PHOTOS } from "@/content/asante-container-photos";
import { ASANTE_CONTAINER_STOCK } from "@/content/asante-container-stock";
import { addProductImage, importProductsFromCsv } from "@/server/catalog/admin";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import type { ProductCsvResult } from "@/lib/desk-import";

const CATEGORY_SEED = [
  { slug: "cookware", name: "Cookware", sort: 10 },
  { slug: "kitchen-appliances", name: "Kitchen Appliances", sort: 20 },
  { slug: "tableware", name: "Tableware", sort: 30 },
  { slug: "storage-insulation", name: "Insulation & Food Storage", sort: 40 },
  { slug: "home-essentials", name: "Home Essentials", sort: 50 },
];

export async function importAsanteContainerStock(actorId: string): Promise<ProductCsvResult> {
  for (const category of CATEGORY_SEED) {
    await query(sql`
      INSERT INTO categories (slug, name, description, sort_order, is_active)
      VALUES (${category.slug}, ${category.name}, ${""}, ${category.sort}, TRUE)
      ON CONFLICT (slug) DO NOTHING
    `);
  }
  const rows = ASANTE_CONTAINER_STOCK.map((item, index) => ({
    line: index + 2,
    name: item.name,
    sku: item.sku,
    price: item.price,
    salePrice: null,
    stock: item.stock,
    category: item.category,
    description: item.description,
    listed: true,
    featured: false,
    isNew: false,
    lowStock: 3,
    slug: "",
    imageUrl: "",
  }));
  const result = await importProductsFromCsv({ rows, actorId });
  await query(sql`
    UPDATE products
       SET archived_at = now(), is_active = FALSE
     WHERE archived_at IS NULL AND (sku ILIKE 'DEMO-%' OR slug ILIKE 'demo-%')
  `);
  await query(sql`
    UPDATE products
       SET is_active = TRUE, updated_at = now()
     WHERE archived_at IS NULL AND sku NOT ILIKE 'DEMO-%' AND slug NOT ILIKE 'demo-%'
  `);
  const photos = await attachAsanteContainerPhotos();
  const created = result.created.length;
  const listed = photos.listed.length;
  return {
    ok: created > 0 || result.skipped.length > 0 || listed > 0,
    message:
      created > 0 || result.skipped.length > 0
        ? `Loaded the container list onto the shop. Photographs can be added later.`
        : listed > 0
          ? `Attached photos to ${listed} listed piece${listed === 1 ? "" : "s"}.`
          : result.errors[0] ?? "Could not load the container list.",
    created: result.created,
    skipped: result.skipped,
    attached: photos.attached,
    unmatched: [],
    errors: [...result.errors, ...photos.errors],
  };
}

export async function attachAsanteContainerPhotos(): Promise<{
  attached: string[];
  listed: string[];
  errors: string[];
}> {
  const attached: string[] = [];
  const listed: string[] = [];
  const errors: string[] = [];

  for (const [sku, photo] of Object.entries(ASANTE_CONTAINER_PHOTOS)) {
    const product = await query<{ id: string; name: string }>(
      sql`SELECT id, name FROM products WHERE lower(sku) = lower(${sku}) AND archived_at IS NULL LIMIT 1`,
    );
    const row = product.rows[0];
    if (!row) {
      errors.push(`${sku}: not on the desk yet.`);
      continue;
    }
    const existing = await query<{ url: string }>(
      sql`SELECT url FROM product_images WHERE product_id = ${row.id}`,
    );
    const have = new Set(existing.rows.map((image) => image.url));
    let hasPrimary = existing.rows.length > 0;
    for (const file of photo.files) {
      if (have.has(file)) continue;
      try {
        await addProductImage({
          productId: row.id,
          url: file,
          storageKey: `public:${file.replace(/^\//, "")}`,
          alt: row.name,
          isPrimary: !hasPrimary,
        });
        hasPrimary = true;
        have.add(file);
        attached.push(`${sku} ← ${file}`);
      } catch (error) {
        errors.push(`${sku}: ${error instanceof Error ? error.message : "Could not attach photograph."}`);
      }
    }
    if (have.size > 0) {
      await query(sql`UPDATE products SET is_active = TRUE, updated_at = now() WHERE id = ${row.id}`);
      listed.push(sku);
    }
  }

  return { attached, listed, errors };
}
