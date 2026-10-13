-- Legal name confirmed as Ashanti's Kitchenware (apostrophe; kitchenware, not the wordmark spelling).
UPDATE store_settings
SET value = jsonb_set(
      jsonb_set(value, '{legalName}', '"Ashanti''s Kitchenware"'),
      '{tradingName}',
      '"Ashanti''s Kitchenware"'
    ),
    updated_at = now()
WHERE key = 'contact';
