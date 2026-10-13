-- Sample sale prices on demo SKUs so the storefront can show a promo rail.
-- Staff should replace these with photographed stock and real Ghana Cedi amounts.
UPDATE products SET sale_price = 2799.00 WHERE sku = 'DEMO-BLEND' AND sale_price IS NULL;
UPDATE products SET sale_price = 3899.00 WHERE sku = 'DEMO-AIRFRY' AND sale_price IS NULL;
UPDATE products SET sale_price = 1299.00 WHERE sku = 'DEMO-KETTLE' AND sale_price IS NULL;
UPDATE products SET sale_price = 2499.00 WHERE sku = 'DEMO-TABLE' AND sale_price IS NULL;
