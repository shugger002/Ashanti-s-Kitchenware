ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_locked_until_idx ON users (locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_locked_until_idx ON customers (locked_until) WHERE locked_until IS NOT NULL;
