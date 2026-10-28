import { query, withTransaction, type Db } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { writeAuditLog } from "@/server/auth/audit";

export type InventoryRow = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  slug: string;
  isActive: boolean;
  isDemo: boolean;
  variantId: string | null;
  variantName: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
};

export function isStockOut(row: Pick<InventoryRow, "available">) {
  return row.available <= 0;
}

export function isStockLow(row: Pick<InventoryRow, "available" | "lowStockThreshold">) {
  return row.available > 0 && row.available <= row.lowStockThreshold;
}

export function isStockTight(row: Pick<InventoryRow, "available" | "lowStockThreshold">) {
  return isStockOut(row) || isStockLow(row);
}

export async function listInventory(): Promise<InventoryRow[]> {
  const result = await query<{
    id: string;
    product_id: string;
    product_name: string;
    sku: string;
    slug: string;
    is_active: boolean;
    is_demo: boolean;
    variant_id: string | null;
    variant_name: string | null;
    image_url: string | null;
    image_alt: string | null;
    on_hand: string;
    reserved: string;
    low_stock_threshold: number;
  }>(sql`
    SELECT i.id, i.product_id, p.name AS product_name, COALESCE(v.sku, p.sku) AS sku,
            p.slug, p.is_active,
            (COALESCE(v.sku, p.sku) ILIKE 'DEMO-%' OR p.slug ILIKE 'demo-%') AS is_demo,
            i.variant_id, v.name AS variant_name, img.url AS image_url, img.alt AS image_alt,
            i.on_hand::text, i.reserved::text, i.low_stock_threshold
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     LEFT JOIN product_variants v ON v.id = i.variant_id
     LEFT JOIN LATERAL (
       SELECT pi.url, pi.alt FROM product_images pi
       WHERE pi.product_id = p.id
       ORDER BY pi.is_primary DESC, pi.sort_order ASC
       LIMIT 1
     ) img ON TRUE
     WHERE p.archived_at IS NULL
     ORDER BY p.name, v.name NULLS FIRST
  `);
  return result.rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    slug: row.slug,
    isActive: row.is_active,
    isDemo: row.is_demo,
    variantId: row.variant_id,
    variantName: row.variant_name,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    onHand: Number(row.on_hand),
    reserved: Number(row.reserved),
    available: Number(row.on_hand) - Number(row.reserved),
    lowStockThreshold: row.low_stock_threshold,
  }));
}

export async function countStockGlance(): Promise<{
  work: number;
  low: number;
  out: number;
  items: number;
}> {
  const result = await query<{
    work: string;
    low: string;
    out: string;
    items: string;
  }>(sql`
    SELECT
      count(*) FILTER (
        WHERE NOT is_demo AND (
          on_hand - reserved <= 0
          OR (on_hand - reserved > 0 AND on_hand - reserved <= low_stock_threshold)
        )
      )::text AS work,
      count(*) FILTER (
        WHERE NOT is_demo AND on_hand - reserved > 0 AND on_hand - reserved <= low_stock_threshold
      )::text AS low,
      count(*) FILTER (WHERE NOT is_demo AND on_hand - reserved <= 0)::text AS out,
      count(*) FILTER (WHERE NOT is_demo)::text AS items
     FROM (
       SELECT i.on_hand, i.reserved, i.low_stock_threshold,
              (COALESCE(v.sku, p.sku) ILIKE 'DEMO-%' OR p.slug ILIKE 'demo-%') AS is_demo
        FROM inventory i
        JOIN products p ON p.id = i.product_id
        LEFT JOIN product_variants v ON v.id = i.variant_id
        WHERE p.archived_at IS NULL
     ) s
  `);
  const row = result.rows[0];
  return {
    work: Number(row?.work ?? 0),
    low: Number(row?.low ?? 0),
    out: Number(row?.out ?? 0),
    items: Number(row?.items ?? 0),
  };
}

export async function adjustStock(input: {
  inventoryId: string;
  deltaOnHand: number;
  reason: string;
  notes: string;
  actorUserId: string;
  source?: "adjustment" | "restock";
}): Promise<void> {
  await withTransaction(async (db) => {
    const locked = await db.query<{ on_hand: number; reserved: number }>(
      sql`SELECT on_hand, reserved FROM inventory WHERE id = ${input.inventoryId} FOR UPDATE`,
    );
    const row = locked.rows[0];
    if (!row) throw new Error("Inventory row not found");
    const next = row.on_hand + input.deltaOnHand;
    if (next < row.reserved) {
      throw new Error("Adjustment would make on-hand lower than reserved stock");
    }
    await db.query(sql`UPDATE inventory SET on_hand = ${next}, updated_at = now() WHERE id = ${input.inventoryId}`);
    await db.query(sql`
      INSERT INTO inventory_movements
         (inventory_id, delta_on_hand, reason, source, actor_user_id, notes)
       VALUES (${input.inventoryId}, ${input.deltaOnHand}, ${input.reason}, ${input.source ?? "adjustment"}, ${input.actorUserId}, ${input.notes})
    `);
    await writeAuditLog(
      {
        actorUserId: input.actorUserId,
        action: "inventory.adjust",
        entityType: "inventory",
        entityId: input.inventoryId,
        metadata: { deltaOnHand: input.deltaOnHand, reason: input.reason },
      },
      db,
    );
  });
}

export async function lockAndReserve(
  db: Db,
  input: { productId: string; variantId: string | null; quantity: number; orderId: string },
): Promise<{ inventoryId: string; unitAvailable: number }> {
  const locked = input.variantId
    ? await db.query<{ id: string; on_hand: number; reserved: number }>(
        sql`SELECT id, on_hand, reserved FROM inventory WHERE variant_id = ${input.variantId} FOR UPDATE`,
      )
    : await db.query<{ id: string; on_hand: number; reserved: number }>(sql`
        SELECT id, on_hand, reserved FROM inventory
         WHERE product_id = ${input.productId} AND variant_id IS NULL FOR UPDATE
      `);
  const row = locked.rows[0];
  if (!row) throw new Error("No inventory record for this product");
  const available = row.on_hand - row.reserved;
  if (available < input.quantity) {
    throw new Error("Insufficient stock");
  }
  await db.query(sql`UPDATE inventory SET reserved = reserved + ${input.quantity}, updated_at = now() WHERE id = ${row.id}`);
  await db.query(sql`
    INSERT INTO inventory_movements
       (inventory_id, delta_reserved, reason, source, order_id)
     VALUES (${row.id}, ${input.quantity}, 'Checkout reservation', 'reservation', ${input.orderId})
  `);
  return { inventoryId: row.id, unitAvailable: available };
}

export async function convertReservationToSale(
  db: Db,
  input: { orderId: string },
): Promise<void> {
  const items = await db.query<{ product_id: string; variant_id: string | null; quantity: number }>(
    sql`SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ${input.orderId}`,
  );
  for (const item of items.rows) {
    const inv = item.variant_id
      ? await db.query<{ id: string }>(sql`SELECT id FROM inventory WHERE variant_id = ${item.variant_id} FOR UPDATE`)
      : await db.query<{ id: string }>(
          sql`SELECT id FROM inventory WHERE product_id = ${item.product_id} AND variant_id IS NULL FOR UPDATE`,
        );
    const id = inv.rows[0]?.id;
    if (!id) continue;
    await db.query(sql`
      UPDATE inventory
       SET reserved = reserved - ${item.quantity}, on_hand = on_hand - ${item.quantity}, updated_at = now()
       WHERE id = ${id}
    `);
    await db.query(sql`
      INSERT INTO inventory_movements
         (inventory_id, delta_on_hand, delta_reserved, reason, source, order_id)
       VALUES (${id}, ${-item.quantity}, ${-item.quantity}, 'Paid order', 'sale', ${input.orderId})
    `);
  }
}

export async function releaseReservation(
  db: Db,
  input: { orderId: string },
): Promise<void> {
  const items = await db.query<{ product_id: string; variant_id: string | null; quantity: number }>(
    sql`SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ${input.orderId}`,
  );
  for (const item of items.rows) {
    const inv = item.variant_id
      ? await db.query<{ id: string }>(sql`SELECT id FROM inventory WHERE variant_id = ${item.variant_id} FOR UPDATE`)
      : await db.query<{ id: string }>(
          sql`SELECT id FROM inventory WHERE product_id = ${item.product_id} AND variant_id IS NULL FOR UPDATE`,
        );
    const id = inv.rows[0]?.id;
    if (!id) continue;
    await db.query(sql`UPDATE inventory SET reserved = GREATEST(reserved - ${item.quantity}, 0), updated_at = now() WHERE id = ${id}`);
    await db.query(sql`
      INSERT INTO inventory_movements
         (inventory_id, delta_reserved, reason, source, order_id)
       VALUES (${id}, ${-item.quantity}, 'Reservation released', 'reservation_release', ${input.orderId})
    `);
  }
}

export type CsvImportResult = {
  updated: { sku: string; from: number; to: number }[];
  skipped: string[];
  errors: string[];
};

export async function applyInventoryCsv(input: {
  rows: { line: number; sku: string; restock: number | null; onHand: number | null }[];
  actorUserId: string;
}): Promise<CsvImportResult> {
  const updated: CsvImportResult["updated"] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const seen = new Map<string, (typeof input.rows)[number]>();
  for (const row of input.rows) {
    seen.set(row.sku.trim().toLowerCase(), row);
  }

  await withTransaction(async (db) => {
    for (const row of seen.values()) {
      const match = await db.query<{ id: string; on_hand: number; reserved: number; sku: string }>(sql`
        SELECT i.id, i.on_hand, i.reserved, COALESCE(v.sku, p.sku) AS sku
         FROM inventory i
         JOIN products p ON p.id = i.product_id
         LEFT JOIN product_variants v ON v.id = i.variant_id
         WHERE p.archived_at IS NULL AND lower(COALESCE(v.sku, p.sku)) = lower(${row.sku})
         FOR UPDATE OF i
      `);
      const current = match.rows[0];
      if (!current) {
        skipped.push(row.sku);
        continue;
      }
      let next = current.on_hand;
      let reason = "CSV restock";
      if (row.restock != null && row.restock > 0) {
        next = current.on_hand + row.restock;
        reason = "CSV restock";
      } else if (row.onHand != null) {
        next = row.onHand;
        reason = "CSV set on-hand";
      } else {
        continue;
      }
      if (next === current.on_hand) continue;
      if (next < current.reserved) {
        errors.push(
          `${current.sku}: cannot set on-hand to ${next} while ${current.reserved} are reserved.`,
        );
        continue;
      }
      const delta = next - current.on_hand;
      await db.query(sql`UPDATE inventory SET on_hand = ${next}, updated_at = now() WHERE id = ${current.id}`);
      await db.query(sql`
        INSERT INTO inventory_movements
           (inventory_id, delta_on_hand, reason, source, actor_user_id, notes)
         VALUES (${current.id}, ${delta}, ${reason}, 'restock', ${input.actorUserId}, ${`CSV line ${row.line}`})
      `);
      await writeAuditLog(
        {
          actorUserId: input.actorUserId,
          action: "inventory.csv",
          entityType: "inventory",
          entityId: current.id,
          metadata: { sku: current.sku, from: current.on_hand, to: next },
        },
        db,
      );
      updated.push({ sku: current.sku, from: current.on_hand, to: next });
    }
  });

  return { updated, skipped, errors };
}

export async function listMovements(inventoryId: string) {
  const result = await query<{
    id: string;
    delta_on_hand: number;
    delta_reserved: number;
    reason: string;
    source: string;
    notes: string | null;
    created_at: Date;
  }>(sql`
    SELECT id::text, delta_on_hand, delta_reserved, reason, source, notes, created_at
     FROM inventory_movements WHERE inventory_id = ${inventoryId} ORDER BY created_at DESC LIMIT 50
  `);
  return result.rows;
}
