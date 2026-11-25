ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_discount_nonneg;

ALTER TABLE orders
  ADD CONSTRAINT orders_discount_nonneg CHECK (discount_amount >= 0);
