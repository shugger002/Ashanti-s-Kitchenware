-- Photo files stay in object storage. These rows may hold only a short link.
-- Click logs, login attempts, expired sessions, and job runs are trimmed by the daily prune.

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY product_id
           ORDER BY sort_order, id
         ) AS n
    FROM product_images
   WHERE is_primary
)
UPDATE product_images AS image
   SET is_primary = FALSE
  FROM ranked
 WHERE image.id = ranked.id
   AND ranked.n > 1;

ALTER TABLE product_images
  ADD CONSTRAINT product_images_url_pointer CHECK (
    char_length(url) BETWEEN 1 AND 2048
    AND url ~ '^(https://|/)'
  ),
  ADD CONSTRAINT product_images_storage_key_pointer CHECK (
    char_length(storage_key) BETWEEN 1 AND 512
  ),
  ADD CONSTRAINT product_images_alt_length CHECK (char_length(alt) <= 300);

CREATE UNIQUE INDEX IF NOT EXISTS product_images_storage_key_idx
  ON product_images (storage_key);

CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary_idx
  ON product_images (product_id)
  WHERE is_primary;

CREATE TABLE IF NOT EXISTS store_visit_days (
  day DATE PRIMARY KEY,
  views INTEGER NOT NULL,
  visitors INTEGER NOT NULL,
  CONSTRAINT store_visit_days_counts_nonneg CHECK (views >= 0 AND visitors >= 0)
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
  ON password_reset_tokens (expires_at);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx
  ON admin_audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS addresses_customer_id_idx
  ON addresses (customer_id);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx
  ON categories (parent_id);
CREATE INDEX IF NOT EXISTS inventory_movements_actor_idx
  ON inventory_movements (actor_user_id);
CREATE INDEX IF NOT EXISTS inventory_movements_order_id_idx
  ON inventory_movements (order_id);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx
  ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx
  ON order_items (product_id);
CREATE INDEX IF NOT EXISTS order_items_variant_id_idx
  ON order_items (variant_id);
CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx
  ON order_status_history (order_id, created_at);
CREATE INDEX IF NOT EXISTS order_status_history_actor_idx
  ON order_status_history (actor_user_id);
CREATE INDEX IF NOT EXISTS payment_events_payment_id_idx
  ON payment_events (payment_id);
CREATE INDEX IF NOT EXISTS payment_events_created_at_idx
  ON payment_events (created_at DESC);
CREATE INDEX IF NOT EXISTS shipments_order_id_idx
  ON shipments (order_id);
CREATE INDEX IF NOT EXISTS shipping_rates_zone_id_idx
  ON shipping_rates (zone_id);
CREATE INDEX IF NOT EXISTS cart_items_product_id_idx
  ON cart_items (product_id);
