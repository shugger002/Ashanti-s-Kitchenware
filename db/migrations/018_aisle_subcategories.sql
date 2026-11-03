INSERT INTO categories (slug, name, description, sort_order, is_active, parent_id, image_url)
SELECT v.slug, v.name, v.description, v.sort_order, TRUE, p.id, NULL
FROM categories p
CROSS JOIN (
  VALUES
    ('cutlery', 'Cutlery', 'Spoons and cutlery sets.', 31),
    ('drinkware', 'Drinkware', 'Cups and drinking pieces.', 32)
) AS v(slug, name, description, sort_order)
WHERE p.slug = 'tableware'
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
    is_active = TRUE, parent_id = EXCLUDED.parent_id;

INSERT INTO categories (slug, name, description, sort_order, is_active, parent_id, image_url)
SELECT v.slug, v.name, v.description, v.sort_order, TRUE, p.id, NULL
FROM categories p
CROSS JOIN (
  VALUES
    ('food-storage', 'Food storage', 'Boxes and food containers.', 41),
    ('cool-boxes', 'Cool boxes', 'Insulated cool boxes.', 42),
    ('shoe-racks', 'Shoe racks', 'Shoe racks.', 43)
) AS v(slug, name, description, sort_order)
WHERE p.slug = 'storage-insulation'
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
    is_active = TRUE, parent_id = EXCLUDED.parent_id;

INSERT INTO categories (slug, name, description, sort_order, is_active, parent_id, image_url)
SELECT v.slug, v.name, v.description, v.sort_order, TRUE, p.id, NULL
FROM categories p
CROSS JOIN (
  VALUES
    ('furniture', 'Furniture', 'Chairs, tables, sofas, and dressing tables.', 51),
    ('outdoor-shade', 'Outdoor shade', 'Sunshades, awnings, and outdoor seating.', 52),
    ('fans', 'Fans', 'Desk, mini, and handheld fans.', 53),
    ('air-conditioners', 'Air conditioners', 'Room air conditioners.', 54),
    ('soap-dispensers', 'Soap dispensers', 'Press and sensor soap dispensers.', 55)
) AS v(slug, name, description, sort_order)
WHERE p.slug = 'home-essentials'
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
    is_active = TRUE, parent_id = EXCLUDED.parent_id;

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'cutlery' AND p.sku IN ('113-1', 'SPOON');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'drinkware' AND p.sku IN ('JUICE-CUP');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'food-storage' AND p.sku IN ('8490', '194-1');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'cool-boxes' AND p.sku IN ('HS9701-70L');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'shoe-racks' AND p.sku IN ('SHOE-RACK-6L');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'furniture' AND p.sku IN (
  'SOFA-102', 'SOFA-150', '195-1', '195-3', '195-4', '195-5', '195-6',
  '178-3', '178-4', 'JH-658', 'DESK-CHAIR-4060', 'A-710', 'L-2601', 'A-6', 'A-720'
);

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'outdoor-shade' AND p.sku IN (
  '178-6', '178-7', '178-8', '178-9', 'KM-25080', 'KM-25080-MOTOR'
);

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'fans' AND p.sku IN ('F51-FAN', 'MINI-FAN', 'DIGITAL-FAN', 'HANDHELD-FAN');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'air-conditioners' AND p.sku IN ('SMALL-AC', 'GREE-AC-2P', 'GREE-AC-4P');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'soap-dispensers' AND p.sku IN ('SOAP-SENSOR-5', 'SOAP-DISPENSER-PRESS');
