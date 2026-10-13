-- Demo colour variants for layout. Replace with colours actually on the Accra shelf.
UPDATE products
SET has_variants = TRUE, updated_at = now()
WHERE slug IN (
  'demo-cast-iron-dutch-oven',
  'demo-home-blender',
  'demo-electric-kettle',
  'demo-tableware-set'
);

INSERT INTO product_variants (product_id, sku, name, attributes, is_active)
SELECT p.id, v.sku, v.colour, jsonb_build_object('color', v.colour, 'hex', v.hex), TRUE
FROM products p
JOIN (
  VALUES
    ('demo-cast-iron-dutch-oven', 'DEMO-DUTCH-CHAR', 'Charcoal', '#3d3d3d'),
    ('demo-cast-iron-dutch-oven', 'DEMO-DUTCH-TERR', 'Terracotta', '#c45c3e'),
    ('demo-cast-iron-dutch-oven', 'DEMO-DUTCH-STEEL', 'Steel', '#8aa0b4'),
    ('demo-cast-iron-dutch-oven', 'DEMO-DUTCH-NAVY', 'Navy', '#1b365d'),
    ('demo-cast-iron-dutch-oven', 'DEMO-DUTCH-FOG', 'Fog', '#d8d6d2'),
    ('demo-cast-iron-dutch-oven', 'DEMO-DUTCH-SAGE', 'Sage', '#b7c9c2'),
    ('demo-cast-iron-dutch-oven', 'DEMO-DUTCH-CREAM', 'Cream', '#f3ead9'),
    ('demo-home-blender', 'DEMO-BLEND-BLK', 'Black', '#1a1a1a'),
    ('demo-home-blender', 'DEMO-BLEND-WHT', 'White', '#f4f4f4'),
    ('demo-home-blender', 'DEMO-BLEND-RED', 'Red', '#c8102e'),
    ('demo-electric-kettle', 'DEMO-KETTLE-SS', 'Stainless', '#c5c8cc'),
    ('demo-electric-kettle', 'DEMO-KETTLE-BLK', 'Black', '#1a1a1a'),
    ('demo-electric-kettle', 'DEMO-KETTLE-WHT', 'White', '#f4f4f4'),
    ('demo-tableware-set', 'DEMO-TABLE-IVY', 'Ivory', '#f6f1ea'),
    ('demo-tableware-set', 'DEMO-TABLE-GOLD', 'Gold rim', '#c9a227'),
    ('demo-tableware-set', 'DEMO-TABLE-SAGE', 'Sage', '#b7c9c2')
) AS v(slug, sku, colour, hex) ON v.slug = p.slug
ON CONFLICT (sku) DO NOTHING;

INSERT INTO inventory (product_id, variant_id, on_hand, reserved, low_stock_threshold)
SELECT p.id, v.id, 4, 0, 3
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE p.sku LIKE 'DEMO-%'
  AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.variant_id = v.id);

DELETE FROM inventory i
USING products p
WHERE i.product_id = p.id
  AND i.variant_id IS NULL
  AND p.has_variants = TRUE
  AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id);
