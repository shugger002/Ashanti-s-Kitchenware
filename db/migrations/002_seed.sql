INSERT INTO roles (slug, name) VALUES
  ('super_admin', 'Super administrator'),
  ('store_admin', 'Store administrator'),
  ('inventory_manager', 'Inventory manager'),
  ('order_manager', 'Order manager');

INSERT INTO categories (slug, name, description, sort_order, is_active) VALUES
  ('cookware', 'Cookware', 'Pots, pans, and cooking sets.', 10, TRUE),
  ('kitchen-appliances', 'Kitchen appliances', 'Blenders, cookers, fryers, and related appliances.', 20, TRUE),
  ('tableware', 'Tableware', 'Plates, serving pieces, and dining sets.', 30, TRUE),
  ('storage-insulation', 'Storage and insulation', 'Racks, lunch boxes, and food warmers.', 40, TRUE),
  ('home-essentials', 'Home essentials', 'Household items sold alongside the kitchen range.', 50, TRUE);

INSERT INTO store_settings (key, value) VALUES
(
  'contact',
  '{
    "legalName": "Ashantis Kitchenware",
    "tradingName": "Ashantis Kitchenware",
    "email": "support@ashantiskitchenware.com",
    "phoneDisplay": "+233 (0) 20 194 4235",
    "phoneE164": "+233201944235",
    "whatsappE164": "+233201944235",
    "addressLine1": "Hyde Street, Sakaman, Odorkor",
    "city": "Accra",
    "region": "Greater Accra",
    "country": "Ghana",
    "mapsUrl": "https://maps.google.com/?q=5.571348,-0.272244",
    "sourceNote": "Map pin supplied by the shop. Road name from OpenStreetMap reverse of that pin."
  }'::jsonb
),
(
  'announcement',
  '{
    "enabled": false,
    "text": ""
  }'::jsonb
),
(
  'hero',
  '{
    "title": "Kitchenware for Ghanaian homes",
    "subtitle": "An established retailer now taking orders online. The catalogue will list photographed stock only.",
    "ctaLabel": "Browse the shop",
    "ctaHref": "/shop",
    "placeholder": true
  }'::jsonb
),
(
  'social',
  '{
    "instagram": "",
    "facebook": "",
    "twitter": "",
    "linkedin": ""
  }'::jsonb
),
(
  'policies',
  '{
    "privacyUpdated": "2026-09-10",
    "termsUpdated": "2026-09-10",
    "refundUpdated": "2026-09-10",
    "cookieUpdated": "2026-09-10"
  }'::jsonb
);
