ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status;
ALTER TABLE orders ADD CONSTRAINT orders_status CHECK (
  status IN (
    'pending_payment',
    'paid',
    'packing',
    'shipped',
    'ready_for_collection',
    'delivered',
    'collected',
    'cancelled',
    'refunded'
  )
);
