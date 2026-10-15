-- Demo catalogue using local /demo photographs. Replace before launch.
UPDATE store_settings
SET value = '{"enabled": true, "text": "Demo photography and logo are on this site for layout. Replace with official assets before launch."}'::jsonb,
    updated_at = now()
WHERE key = 'announcement';

INSERT INTO products (
  category_id, slug, sku, name, description, price, is_active, is_featured, is_new, seo_title, seo_description
)
SELECT c.id, v.slug, v.sku, v.name, v.description, v.price::numeric, TRUE, v.featured, v.is_new, v.name, left(v.description, 160)
FROM (
  VALUES
    ('cookware', 'demo-stainless-pot-set', 'DEMO-POT-10', '10-piece stainless pot set', 'A stacked stainless cooking set for family meals. Demo listing: confirm price, contents, and photograph against real stock before sale.', '6199.00', TRUE, FALSE),
    ('cookware', 'demo-cast-iron-dutch-oven', 'DEMO-DUTCH', 'Cast iron Dutch oven', 'Heavy enamel-coated pot for stews. Demo listing: replace this photograph with the actual piece in the Accra shop.', '7499.00', TRUE, TRUE),
    ('kitchen-appliances', 'demo-home-blender', 'DEMO-BLEND', 'Home blender', 'Upright blender with a clear jug. Demo listing: wattage and plug type must be verified before publishing live.', '3299.00', TRUE, FALSE),
    ('kitchen-appliances', 'demo-air-fryer', 'DEMO-AIRFRY', 'Digital air fryer', 'Basket-style air fryer. Demo listing: capacity and voltage must match the unit on the shelf.', '4599.00', FALSE, TRUE),
    ('kitchen-appliances', 'demo-electric-kettle', 'DEMO-KETTLE', 'Stainless electric kettle', 'Cordless kettle shown with a 3-pin plug. Demo listing: confirm litre size against stock.', '1599.00', TRUE, FALSE),
    ('tableware', 'demo-tableware-set', 'DEMO-TABLE', 'Gold-rim tableware set', 'Plates, bowls, and a jug for a dining table. Demo listing: piece count must be counted from the boxed set.', '2899.00', TRUE, FALSE),
    ('kitchen-appliances', 'demo-rice-cooker', 'DEMO-RICE', '5 litre rice cooker', 'Family-size rice cooker with a glass lid. Demo listing: confirm litre mark and plug before sale.', '2399.00', FALSE, TRUE),
    ('storage-insulation', 'demo-kitchen-storage-rack', 'DEMO-RACK', '5-layer kitchen storage rack', 'Open metal rack for pans and dry goods. Demo listing: confirm height against the packed unit.', '2899.00', FALSE, FALSE)
) AS v(category_slug, slug, sku, name, description, price, featured, is_new)
JOIN categories c ON c.slug = v.category_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_images (product_id, url, storage_key, alt, is_primary, sort_order)
SELECT p.id, v.url, v.url, p.name || ' (demo photograph)', TRUE, 0
FROM products p
JOIN (
  VALUES
    ('demo-stainless-pot-set', '/demo/pot-set.jpg'),
    ('demo-cast-iron-dutch-oven', '/demo/dutch-oven.jpg'),
    ('demo-home-blender', '/demo/blender.jpg'),
    ('demo-air-fryer', '/demo/air-fryer.jpg'),
    ('demo-electric-kettle', '/demo/kettle.jpg'),
    ('demo-tableware-set', '/demo/tableware.jpg'),
    ('demo-rice-cooker', '/demo/rice-cooker.jpg'),
    ('demo-kitchen-storage-rack', '/demo/storage-rack.jpg')
) AS v(slug, url) ON v.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id);

INSERT INTO inventory (product_id, variant_id, on_hand, reserved, low_stock_threshold)
SELECT p.id, NULL, 10, 0, 3
FROM products p
WHERE p.sku LIKE 'DEMO-%'
  AND NOT EXISTS (
    SELECT 1 FROM inventory i WHERE i.product_id = p.id AND i.variant_id IS NULL
  );
