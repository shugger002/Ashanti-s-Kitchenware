ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL;
