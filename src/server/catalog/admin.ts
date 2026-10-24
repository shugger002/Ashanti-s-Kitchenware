import { query, withTransaction, type Db } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/server/auth/audit";
import { parseMoney } from "@/lib/money";
import { normalizeHex } from "@/lib/product-color";

export type ProductInput = {
  name: string;
  sku: string;
  slug?: string;
  description: string;
  categoryId: string | null;
  price: number;
  salePrice: number | null;
  specifications: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  lowStockThreshold: number;
  seoTitle: string | null;
  seoDescription: string | null;
  initialStock?: number;
  colors?: { id?: string; name: string; hex: string; stock: number }[];
};

export async function upsertProduct(input: ProductInput, actorId: string, existingId?: string): Promise<string> {
  const slug = input.slug?.trim() || slugify(input.name);
  const price = parseMoney(input.price);
  const salePrice = input.salePrice == null ? null : parseMoney(input.salePrice);

  return withTransaction(async (db) => {
    let id = existingId;
    if (id) {
      await db.query(sql`
        UPDATE products SET
           name=${input.name}, sku=${input.sku.trim()}, slug=${slug}, description=${input.description},
           category_id=${input.categoryId}, price=${price}, sale_price=${salePrice},
           specifications=${JSON.stringify(input.specifications)}::jsonb, is_active=${input.isActive},
           is_featured=${input.isFeatured}, is_new=${input.isNew},
           low_stock_threshold=${input.lowStockThreshold}, seo_title=${input.seoTitle},
           seo_description=${input.seoDescription}, updated_at=now()
         WHERE id=${id} AND archived_at IS NULL
      `);
    } else {
      const inserted = await db.query<{ id: string }>(sql`
        INSERT INTO products (
           name, sku, slug, description, category_id, price, sale_price, specifications,
           is_active, is_featured, is_new, low_stock_threshold, seo_title, seo_description
         ) VALUES (${input.name},${input.sku.trim()},${slug},${input.description},${input.categoryId},${price},${salePrice},${JSON.stringify(input.specifications)}::jsonb,${input.isActive},${input.isFeatured},${input.isNew},${input.lowStockThreshold},${input.seoTitle},${input.seoDescription})
         RETURNING id
      `);
      id = inserted.rows[0].id;
      const hasColours = (input.colors?.filter((row) => row.name.trim()).length ?? 0) > 0;
      const stock = Math.max(0, input.initialStock ?? 0);
      if (!hasColours) {
        await db.query(sql`
          INSERT INTO inventory (product_id, variant_id, on_hand, reserved, low_stock_threshold)
           VALUES (${id}, NULL, ${stock}, 0, ${input.lowStockThreshold})
        `);
        if (stock > 0) {
          const inv = await db.query<{ id: string }>(
            sql`SELECT id FROM inventory WHERE product_id = ${id} AND variant_id IS NULL`,
          );
          await db.query(sql`
            INSERT INTO inventory_movements
               (inventory_id, delta_on_hand, reason, source, actor_user_id, notes)
             VALUES (${inv.rows[0].id}, ${stock}, 'Initial stock', 'restock', ${actorId}, 'Product created')
          `);
        }
      }
    }
    if (input.colors) {
      await syncProductColours(db, id!, input.sku.trim(), input.colors, input.lowStockThreshold);
    }
    await writeAuditLog(
      {
        actorUserId: actorId,
        action: existingId ? "product.update" : "product.create",
        entityType: "product",
        entityId: id,
      },
      db,
    );
    return id!;
  });
}

async function syncProductColours(
  db: Db,
  productId: string,
  productSku: string,
  colors: { id?: string; name: string; hex: string; stock: number }[],
  lowStockThreshold: number,
) {
  const rows = colors.filter((row) => row.name.trim());
  const keepIds: string[] = [];

  for (const row of rows) {
    const name = row.name.trim();
    const hex = normalizeHex(row.hex, name);
    const attributes = JSON.stringify({ color: name, hex });
    const stock = Math.max(0, Math.floor(row.stock) || 0);
    let variantId = row.id?.trim() || "";

    if (variantId) {
      const updated = await db.query(sql`
        UPDATE product_variants
         SET name = ${name}, attributes = ${attributes}::jsonb, is_active = TRUE
         WHERE id = ${variantId} AND product_id = ${productId}
         RETURNING id
      `);
      if (!updated.rows[0]) variantId = "";
    }

    if (!variantId) {
      const sku = `${productSku}-${slugify(name)}`.slice(0, 80);
      const inserted = await db.query<{ id: string }>(sql`
        INSERT INTO product_variants (product_id, sku, name, attributes, is_active)
         VALUES (${productId}, ${sku}, ${name}, ${attributes}::jsonb, TRUE)
         ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, attributes = EXCLUDED.attributes, is_active = TRUE
         RETURNING id
      `);
      variantId = inserted.rows[0].id;
    }

    keepIds.push(variantId);
    const existing = await db.query<{ id: string }>(sql`SELECT id FROM inventory WHERE variant_id = ${variantId}`);
    if (existing.rows[0]) {
      await db.query(
        sql`UPDATE inventory SET on_hand = GREATEST(${stock}, reserved), updated_at = now() WHERE variant_id = ${variantId}`,
      );
    } else {
      await db.query(sql`
        INSERT INTO inventory (product_id, variant_id, on_hand, reserved, low_stock_threshold)
         VALUES (${productId}, ${variantId}, ${stock}, 0, ${lowStockThreshold})
      `);
    }
  }

  if (keepIds.length > 0) {
    await db.query(
      sql`DELETE FROM product_variants WHERE product_id = ${productId} AND NOT (id = ANY(${keepIds}::uuid[]))`,
    );
    await db.query(sql`DELETE FROM inventory WHERE product_id = ${productId} AND variant_id IS NULL`);
    await db.query(sql`UPDATE products SET has_variants = TRUE, updated_at = now() WHERE id = ${productId}`);
  } else {
    await db.query(sql`DELETE FROM product_variants WHERE product_id = ${productId}`);
    await db.query(sql`UPDATE products SET has_variants = FALSE, updated_at = now() WHERE id = ${productId}`);
    const parent = await db.query(sql`SELECT id FROM inventory WHERE product_id = ${productId} AND variant_id IS NULL`);
    if (!parent.rows[0]) {
      await db.query(sql`
        INSERT INTO inventory (product_id, variant_id, on_hand, reserved, low_stock_threshold)
         VALUES (${productId}, NULL, 0, 0, ${lowStockThreshold})
      `);
    }
  }
}

export async function importProductsFromCsv(input: {
  rows: {
    line: number;
    name: string;
    sku: string;
    price: number;
    salePrice: number | null;
    stock: number;
    category: string;
    description: string;
    listed: boolean;
    featured: boolean;
    isNew: boolean;
    lowStock: number;
    slug: string;
    imageUrl: string;
  }[];
  actorId: string;
}): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const categories = await query<{ id: string; name: string; slug: string }>(
    sql`SELECT id, name, slug FROM categories`,
  );
  const categoryByKey = new Map<string, string>();
  for (const row of categories.rows) {
    categoryByKey.set(row.name.trim().toLowerCase(), row.id);
    categoryByKey.set(row.slug.trim().toLowerCase(), row.id);
  }

  for (const row of input.rows) {
    const existing = await query<{ id: string }>(
      sql`SELECT id FROM products WHERE lower(sku) = lower(${row.sku}) AND archived_at IS NULL`,
    );
    if (existing.rows[0]) {
      if (row.listed) {
        await query(
          sql`UPDATE products SET is_active = TRUE, updated_at = now() WHERE id = ${existing.rows[0].id} AND archived_at IS NULL`,
        );
      }
      skipped.push(row.sku);
      continue;
    }
    let categoryId: string | null = null;
    if (row.category) {
      categoryId = categoryByKey.get(row.category.trim().toLowerCase()) ?? null;
      if (!categoryId) {
        errors.push(`Line ${row.line} (${row.sku}): unknown category "${row.category}".`);
        continue;
      }
    }
    try {
      let slug = (row.slug || slugify(row.name)).slice(0, 80);
      const slugTaken = await query(sql`SELECT 1 FROM products WHERE slug = ${slug}`);
      if (slugTaken.rows[0]) slug = `${slug}-${slugify(row.sku)}`.slice(0, 80);
      const id = await upsertProduct(
        {
          name: row.name,
          sku: row.sku,
          slug,
          description: row.description,
          categoryId,
          price: row.price,
          salePrice: row.salePrice,
          specifications: {},
          isActive: row.listed,
          isFeatured: row.featured,
          isNew: row.isNew,
          lowStockThreshold: row.lowStock,
          seoTitle: null,
          seoDescription: null,
          initialStock: row.stock,
        },
        input.actorId,
      );
      if (row.imageUrl) {
        await addProductImage({
          productId: id,
          url: row.imageUrl,
          storageKey: `csv:${row.sku}`,
          alt: row.name,
          isPrimary: true,
        });
      }
      created.push(row.sku);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create product.";
      errors.push(`Line ${row.line} (${row.sku}): ${message}`);
    }
  }
  return { created, skipped, errors };
}

export async function archiveProduct(id: string, actorId: string): Promise<void> {
  await query(sql`UPDATE products SET archived_at = now(), is_active = FALSE WHERE id = ${id}`);
  await writeAuditLog({
    actorUserId: actorId,
    action: "product.archive",
    entityType: "product",
    entityId: id,
  });
}

export async function addProductImage(input: {
  productId: string;
  url: string;
  storageKey: string;
  alt: string;
  isPrimary: boolean;
}): Promise<void> {
  if (input.isPrimary) {
    await query(sql`UPDATE product_images SET is_primary = FALSE WHERE product_id = ${input.productId}`);
  }
  await query(sql`
    INSERT INTO product_images (product_id, url, storage_key, alt, is_primary)
     VALUES (${input.productId},${input.url},${input.storageKey},${input.alt},${input.isPrimary})
  `);
}

export async function setProductImagePrimary(productId: string, imageId: string): Promise<void> {
  const owned = await query<{ id: string }>(
    sql`SELECT id FROM product_images WHERE id = ${imageId} AND product_id = ${productId} LIMIT 1`,
  );
  if (!owned.rows[0]) throw new Error("Photo not found");
  await query(sql`UPDATE product_images SET is_primary = FALSE WHERE product_id = ${productId}`);
  await query(sql`UPDATE product_images SET is_primary = TRUE WHERE id = ${imageId} AND product_id = ${productId}`);
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const owned = await query<{ id: string; is_primary: boolean }>(
    sql`SELECT id, is_primary FROM product_images WHERE id = ${imageId} AND product_id = ${productId} LIMIT 1`,
  );
  if (!owned.rows[0]) throw new Error("Photo not found");
  await query(sql`DELETE FROM product_images WHERE id = ${imageId} AND product_id = ${productId}`);
  if (owned.rows[0].is_primary) {
    const next = await query<{ id: string }>(
      sql`SELECT id FROM product_images WHERE product_id = ${productId} ORDER BY sort_order ASC, id ASC LIMIT 1`,
    );
    if (next.rows[0]) {
      await query(sql`UPDATE product_images SET is_primary = TRUE WHERE id = ${next.rows[0].id}`);
    }
  }
}

export async function setProductSalePrice(
  productId: string,
  salePrice: number | null,
  actorId: string,
): Promise<void> {
  await query(
    sql`UPDATE products SET sale_price = ${salePrice}, updated_at = now() WHERE id = ${productId} AND archived_at IS NULL`,
  );
  await writeAuditLog({
    actorUserId: actorId,
    action: "product.sale_price",
    entityType: "product",
    entityId: productId,
    metadata: { salePrice },
  });
}

export async function upsertCategory(input: {
  id?: string;
  name: string;
  slug?: string;
  description: string;
  isActive: boolean;
}): Promise<void> {
  const slug = input.slug?.trim() || slugify(input.name);
  if (input.id) {
    await query(
      sql`UPDATE categories SET name=${input.name}, slug=${slug}, description=${input.description}, is_active=${input.isActive} WHERE id=${input.id}`,
    );
    return;
  }
  await query(
    sql`INSERT INTO categories (name, slug, description, is_active) VALUES (${input.name},${slug},${input.description},${input.isActive})`,
  );
}
