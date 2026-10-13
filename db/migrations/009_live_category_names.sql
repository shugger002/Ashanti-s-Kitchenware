-- Match the live store’s published category names (not the old product catalogue).
UPDATE categories SET name = 'Kitchen Appliances' WHERE slug = 'kitchen-appliances';
UPDATE categories SET
  name = 'Insulation & Food Storage',
  description = 'Racks, lunch boxes, insulation, and food storage.'
WHERE slug = 'storage-insulation';
UPDATE categories SET name = 'Home Essentials' WHERE slug = 'home-essentials';
