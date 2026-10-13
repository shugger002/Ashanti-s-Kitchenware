ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS customers_registered_email_uidx
  ON customers ((lower(email)))
  WHERE password_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS customer_sessions_customer_id_idx ON customer_sessions (customer_id);
CREATE INDEX IF NOT EXISTS customer_sessions_expires_at_idx ON customer_sessions (expires_at);

UPDATE store_settings
SET value = jsonb_set(
  jsonb_set(value, '{legalName}', '"Ashantis Kitchenware"'),
  '{tradingName}', '"Ashantis Kitchenware"'
),
updated_at = now()
WHERE key = 'contact';
