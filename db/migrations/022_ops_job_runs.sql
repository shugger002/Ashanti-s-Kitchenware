CREATE TABLE IF NOT EXISTS ops_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'failed', 'skipped')),
  summary TEXT NOT NULL DEFAULT '',
  entity_id TEXT,
  retryable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ops_job_runs_created_at_idx ON ops_job_runs (created_at DESC);

INSERT INTO store_settings (key, value, updated_at)
VALUES (
  'operations',
  '{"checkoutPaused":false,"maintenanceMessage":"Checkout is paused while we update the shop. Your cart is saved. WhatsApp the Accra shop if you need to order now.","reviewsEnabled":true,"newsletterEnabled":true,"promoPopupEnabled":true}'::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;
