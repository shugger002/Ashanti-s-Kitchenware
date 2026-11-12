ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status CHECK (
  payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')
);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status;
ALTER TABLE payments ADD CONSTRAINT payments_status CHECK (
  status IN ('initialized', 'pending', 'successful', 'failed', 'refunded')
);
