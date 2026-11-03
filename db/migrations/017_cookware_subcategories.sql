INSERT INTO categories (slug, name, description, sort_order, is_active, parent_id, image_url)
SELECT
  v.slug,
  v.name,
  v.description,
  v.sort_order,
  TRUE,
  p.id,
  v.image_url
FROM categories p
CROSS JOIN (
  VALUES
    ('cookware-sets', 'Cookware sets', 'Multi-piece pot and pan sets.', 11, '/demo/pot-set.jpg'::text),
    ('soup-pots', 'Soup pots', 'Single soup pots.', 12, NULL),
    ('cooking-pots', 'Cooking pots', 'Large round and rectangle cooking pots.', 13, NULL)
) AS v(slug, name, description, sort_order, image_url)
WHERE p.slug = 'cookware'
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  parent_id = EXCLUDED.parent_id,
  image_url = COALESCE(categories.image_url, EXCLUDED.image_url);

UPDATE products p
SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'cookware-sets'
  AND p.sku IN (
    'J9142', 'U-PS0107', 'UC23316', 'U-SC020', 'UC23411', 'UC2611S', 'OS-FD017', 'WK-21PCS'
  );

UPDATE products p
SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'soup-pots'
  AND p.sku IN (
    'DEMAKE-POT-24', 'RAYE-POT-20', 'RAYE-POT-22', 'AVERY-POT-24', 'AVERY-POT-18',
    'COLIN-POT-24', 'ELENA-POT-22', 'ELENA-POT-24'
  );

UPDATE products p
SET category_id = c.id, updated_at = now()
FROM categories c
WHERE c.slug = 'cooking-pots'
  AND p.sku IN ('APA-126', 'APA-127');
