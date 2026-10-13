import type { PoolClient } from "pg";
import { query, withTransaction } from "@/server/db/pool";
import { writeAuditLog } from "@/server/auth/audit";

export type InventoryRow = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantId: string | null;
  variantName: string | null;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
};

export async function listInventory(): Promise<InventoryRow[]> {
  const result = await query<{
    id: string;
    product_id: string;
    product_name: string;
    sku: string;
    variant_id: string | null;
    variant_name: string | null;
    on_hand: string;
    reserved: string;
    low_stock_threshold: number;
  }>(
    `SELECT i.id, i.product_id, p.name AS product_name, COALESCE(v.sku, p.sku) AS sku,
            i.variant_id, v.name AS variant_name, i.on_hand::text, i.reserved::text,
            i.low_stock_threshold
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     LEFT JOIN product_variants v ON v.id = i.variant_id
     WHERE p.archived_at IS NULL
     ORDER BY p.name, v.name NULLS FIRST`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    variantId: row.variant_id,
    variantName: row.variant_name,
    onHand: Number(row.on_hand),
    reserved: Number(row.reserved),
    available: Number(row.on_hand) - Number(row.reserved),
    lowStockThreshold: row.low_stock_threshold,
  }));
}

export async function adjustStock(input: {
  inventoryId: string;
  deltaOnHand: number;
  reason: string;
  notes: string;
  actorUserId: string;
  source?: "adjustment" | "restock";
}): Promise<void> {
  await withTransaction(async (client) => {
    const locked = await client.query<{ on_hand: number; reserved: number }>(
      `SELECT on_hand, reserved FROM inventory WHERE id = $1 FOR UPDATE`,
      [input.inventoryId],
    );
    const row = locked.rows[0];
    if (!row) throw new Error("Inventory row not found");
    const next = row.on_hand + input.deltaOnHand;
    if (next < row.reserved) {
      throw new Error("Adjustment would make on-hand lower than reserved stock");
    }
    await client.query(
      `UPDATE inventory SET on_hand = $2, updated_at = now() WHERE id = $1`,
      [input.inventoryId, next],
    );
    await client.query(
      `INSERT INTO inventory_movements
         (inventory_id, delta_on_hand, reason, source, actor_user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.inventoryId,
        input.deltaOnHand,
        input.reason,
        input.source ?? "adjustment",
        input.actorUserId,
        input.notes,
      ],
    );
    await writeAuditLog(
      {
        actorUserId: input.actorUserId,
        action: "inventory.adjust",
        entityType: "inventory",
        entityId: input.inventoryId,
        metadata: { deltaOnHand: input.deltaOnHand, reason: input.reason },
      },
      client,
    );
  });
}

export async function lockAndReserve(
  client: PoolClient,
  input: { productId: string; variantId: string | null; quantity: number; orderId: string },
): Promise<{ inventoryId: string; unitAvailable: number }> {
  const locked = input.variantId
    ? await client.query<{ id: string; on_hand: number; reserved: number }>(
        `SELECT id, on_hand, reserved FROM inventory WHERE variant_id = $1 FOR UPDATE`,
        [input.variantId],
      )
    : await client.query<{ id: string; on_hand: number; reserved: number }>(
        `SELECT id, on_hand, reserved FROM inventory
         WHERE product_id = $1 AND variant_id IS NULL FOR UPDATE`,
        [input.productId],
      );
  const row = locked.rows[0];
  if (!row) throw new Error("No inventory record for this product");
  const available = row.on_hand - row.reserved;
  if (available < input.quantity) {
    throw new Error("Insufficient stock");
  }
  await client.query(
    `UPDATE inventory SET reserved = reserved + $2, updated_at = now() WHERE id = $1`,
    [row.id, input.quantity],
  );
  await client.query(
    `INSERT INTO inventory_movements
       (inventory_id, delta_reserved, reason, source, order_id)
     VALUES ($1, $2, 'Checkout reservation', 'reservation', $3)`,
    [row.id, input.quantity, input.orderId],
  );
  return { inventoryId: row.id, unitAvailable: available };
}

export async function convertReservationToSale(
  client: PoolClient,
  input: { orderId: string },
): Promise<void> {
  const items = await client.query<{ product_id: string; variant_id: string | null; quantity: number }>(
    `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1`,
    [input.orderId],
  );
  for (const item of items.rows) {
    const inv = item.variant_id
      ? await client.query<{ id: string }>(
          `SELECT id FROM inventory WHERE variant_id = $1 FOR UPDATE`,
          [item.variant_id],
        )
      : await client.query<{ id: string }>(
          `SELECT id FROM inventory WHERE product_id = $1 AND variant_id IS NULL FOR UPDATE`,
          [item.product_id],
        );
    const id = inv.rows[0]?.id;
    if (!id) continue;
    await client.query(
      `UPDATE inventory
       SET reserved = reserved - $2, on_hand = on_hand - $2, updated_at = now()
       WHERE id = $1`,
      [id, item.quantity],
    );
    await client.query(
      `INSERT INTO inventory_movements
         (inventory_id, delta_on_hand, delta_reserved, reason, source, order_id)
       VALUES ($1, $2, $3, 'Paid order', 'sale', $4)`,
      [id, -item.quantity, -item.quantity, input.orderId],
    );
  }
}

export async function releaseReservation(
  client: PoolClient,
  input: { orderId: string },
): Promise<void> {
  const items = await client.query<{ product_id: string; variant_id: string | null; quantity: number }>(
    `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1`,
    [input.orderId],
  );
  for (const item of items.rows) {
    const inv = item.variant_id
      ? await client.query<{ id: string }>(`SELECT id FROM inventory WHERE variant_id = $1 FOR UPDATE`, [
          item.variant_id,
        ])
      : await client.query<{ id: string }>(
          `SELECT id FROM inventory WHERE product_id = $1 AND variant_id IS NULL FOR UPDATE`,
          [item.product_id],
        );
    const id = inv.rows[0]?.id;
    if (!id) continue;
    await client.query(
      `UPDATE inventory SET reserved = GREATEST(reserved - $2, 0), updated_at = now() WHERE id = $1`,
      [id, item.quantity],
    );
    await client.query(
      `INSERT INTO inventory_movements
         (inventory_id, delta_reserved, reason, source, order_id)
       VALUES ($1, $2, 'Reservation released', 'reservation_release', $3)`,
      [id, -item.quantity, input.orderId],
    );
  }
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
  }>(
    `SELECT id::text, delta_on_hand, delta_reserved, reason, source, notes, created_at
     FROM inventory_movements WHERE inventory_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [inventoryId],
  );
  return result.rows;
}
