import type { PoolClient } from "pg";
import { query, withTransaction } from "@/server/db/pool";
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

  return withTransaction(async (client) => {
    let id = existingId;
    if (id) {
      await client.query(
        `UPDATE products SET
           name=$2, sku=$3, slug=$4, description=$5, category_id=$6, price=$7, sale_price=$8,
           specifications=$9::jsonb, is_active=$10, is_featured=$11, is_new=$12,
           low_stock_threshold=$13, seo_title=$14, seo_description=$15, updated_at=now()
         WHERE id=$1 AND archived_at IS NULL`,
        [
          id,
          input.name,
          input.sku.trim(),
          slug,
          input.description,
          input.categoryId,
          price,
          salePrice,
          JSON.stringify(input.specifications),
          input.isActive,
          input.isFeatured,
          input.isNew,
          input.lowStockThreshold,
          input.seoTitle,
          input.seoDescription,
        ],
      );
    } else {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO products (
           name, sku, slug, description, category_id, price, sale_price, specifications,
           is_active, is_featured, is_new, low_stock_threshold, seo_title, seo_description
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
        [
          input.name,
          input.sku.trim(),
          slug,
          input.description,
          input.categoryId,
          price,
          salePrice,
          JSON.stringify(input.specifications),
          input.isActive,
          input.isFeatured,
          input.isNew,
          input.lowStockThreshold,
          input.seoTitle,
          input.seoDescription,
        ],
      );
      id = inserted.rows[0].id;
      const hasColours = (input.colors?.filter((row) => row.name.trim()).length ?? 0) > 0;
      const stock = Math.max(0, input.initialStock ?? 0);
      if (!hasColours) {
      await client.query(
        `INSERT INTO inventory (product_id, variant_id, on_hand, reserved, low_stock_threshold)
         VALUES ($1, NULL, $2, 0, $3)`,
        [id, stock, input.lowStockThreshold],
      );
      if (stock > 0) {
        const inv = await client.query<{ id: string }>(
          `SELECT id FROM inventory WHERE product_id = $1 AND variant_id IS NULL`,
          [id],
        );
        await client.query(
          `INSERT INTO inventory_movements
             (inventory_id, delta_on_hand, reason, source, actor_user_id, notes)
           VALUES ($1, $2, 'Initial stock', 'restock', $3, 'Product created')`,
          [inv.rows[0].id, stock, actorId],
        );
      }
      }
    }
    if (input.colors) {
      await syncProductColours(client, id!, input.sku.trim(), input.colors, input.lowStockThreshold);
    }
    await writeAuditLog(
      {
        actorUserId: actorId,
        action: existingId ? "product.update" : "product.create",
        entityType: "product",
        entityId: id,
      },
      client,
    );
    return id!;
  });
}

async function syncProductColours(
  client: PoolClient,
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
      const updated = await client.query(
        `UPDATE product_variants
         SET name = $2, attributes = $3::jsonb, is_active = TRUE
         WHERE id = $1 AND product_id = $4
         RETURNING id`,
        [variantId, name, attributes, productId],
      );
      if (!updated.rows[0]) variantId = "";
    }

    if (!variantId) {
      const sku = `${productSku}-${slugify(name)}`.slice(0, 80);
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO product_variants (product_id, sku, name, attributes, is_active)
         VALUES ($1, $2, $3, $4::jsonb, TRUE)
         ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, attributes = EXCLUDED.attributes, is_active = TRUE
         RETURNING id`,
        [productId, sku, name, attributes],
      );
      variantId = inserted.rows[0].id;
    }

    keepIds.push(variantId);
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM inventory WHERE variant_id = $1`,
      [variantId],
    );
    if (existing.rows[0]) {
      await client.query(
        `UPDATE inventory SET on_hand = GREATEST($2, reserved), updated_at = now() WHERE variant_id = $1`,
        [variantId, stock],
      );
    } else {
      await client.query(
        `INSERT INTO inventory (product_id, variant_id, on_hand, reserved, low_stock_threshold)
         VALUES ($1, $2, $3, 0, $4)`,
        [productId, variantId, stock, lowStockThreshold],
      );
    }
  }

  if (keepIds.length > 0) {
    await client.query(
      `DELETE FROM product_variants WHERE product_id = $1 AND NOT (id = ANY($2::uuid[]))`,
      [productId, keepIds],
    );
    await client.query(`DELETE FROM inventory WHERE product_id = $1 AND variant_id IS NULL`, [productId]);
    await client.query(`UPDATE products SET has_variants = TRUE, updated_at = now() WHERE id = $1`, [productId]);
  } else {
    await client.query(`DELETE FROM product_variants WHERE product_id = $1`, [productId]);
    await client.query(`UPDATE products SET has_variants = FALSE, updated_at = now() WHERE id = $1`, [productId]);
    const parent = await client.query(`SELECT id FROM inventory WHERE product_id = $1 AND variant_id IS NULL`, [
      productId,
    ]);
    if (!parent.rows[0]) {
      await client.query(
        `INSERT INTO inventory (product_id, variant_id, on_hand, reserved, low_stock_threshold)
         VALUES ($1, NULL, 0, 0, $2)`,
        [productId, lowStockThreshold],
      );
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
    `SELECT id, name, slug FROM categories`,
  );
  const categoryByKey = new Map<string, string>();
  for (const row of categories.rows) {
    categoryByKey.set(row.name.trim().toLowerCase(), row.id);
    categoryByKey.set(row.slug.trim().toLowerCase(), row.id);
  }

  for (const row of input.rows) {
    const existing = await query<{ id: string }>(
      `SELECT id FROM products WHERE lower(sku) = lower($1) AND archived_at IS NULL`,
      [row.sku],
    );
    if (existing.rows[0]) {
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
      const slugTaken = await query(`SELECT 1 FROM products WHERE slug = $1`, [slug]);
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
  await query(`UPDATE products SET archived_at = now(), is_active = FALSE WHERE id = $1`, [id]);
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
    await query(`UPDATE product_images SET is_primary = FALSE WHERE product_id = $1`, [input.productId]);
  }
  await query(
    `INSERT INTO product_images (product_id, url, storage_key, alt, is_primary)
     VALUES ($1,$2,$3,$4,$5)`,
    [input.productId, input.url, input.storageKey, input.alt, input.isPrimary],
  );
}

export async function setProductSalePrice(
  productId: string,
  salePrice: number | null,
  actorId: string,
): Promise<void> {
  await query(
    `UPDATE products SET sale_price = $2, updated_at = now() WHERE id = $1 AND archived_at IS NULL`,
    [productId, salePrice],
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
      `UPDATE categories SET name=$2, slug=$3, description=$4, is_active=$5 WHERE id=$1`,
      [input.id, input.name, slug, input.description, input.isActive],
    );
    return;
  }
  await query(
    `INSERT INTO categories (name, slug, description, is_active) VALUES ($1,$2,$3,$4)`,
    [input.name, slug, input.description, input.isActive],
  );
}
