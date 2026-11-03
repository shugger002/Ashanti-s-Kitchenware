INSERT INTO categories (slug, name, description, sort_order, is_active, parent_id, image_url)
SELECT v.slug, v.name, v.description, v.sort_order, TRUE, p.id, NULL
FROM categories p
CROSS JOIN (
  VALUES
    ('blenders', 'Blenders', 'Jug and multi-function blenders.', 21),
    ('juicers', 'Juicers', 'Slow juicers.', 22),
    ('microwave-ovens', 'Microwave ovens', 'Countertop microwave ovens.', 23),
    ('kettles', 'Kettles', 'Electric kettles.', 24),
    ('food-warmers', 'Food warmers', 'Electric food warmers.', 25),
    ('rice-cookers', 'Rice cookers', 'Rice cookers.', 26)
) AS v(slug, name, description, sort_order)
WHERE p.slug = 'kitchen-appliances'
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
    is_active = TRUE, parent_id = EXCLUDED.parent_id;

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'blenders' AND p.sku IN ('HM-2067', 'BF-5090', 'BF-5092');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'juicers' AND p.sku IN ('HM-638');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'microwave-ovens' AND p.sku IN ('BM-20MX82-L', 'HM-765');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'kettles' AND p.sku IN ('JL-9008-0', '9058', 'HX9058-0');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'food-warmers' AND p.sku IN (
  'JY94', 'JY88-100', 'JY88-300', 'JN2511', 'JN2401', 'JN2421', 'SF25010'
);

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'rice-cookers' AND p.sku IN ('CFXB-80', 'DEMO-RICE');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'blenders' AND p.sku IN ('DEMO-BLEND');

UPDATE products p SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'kettles' AND p.sku IN ('DEMO-KETTLE');
