CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE roles (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_lower UNIQUE (email)
);

CREATE UNIQUE INDEX users_email_idx ON users ((lower(email)));

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_slug TEXT NOT NULL REFERENCES roles (slug) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_slug)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE login_attempts (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL,
  ip TEXT
);

CREATE INDEX login_attempts_identifier_time_idx ON login_attempts (identifier, attempted_at DESC);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE TABLE admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_logs_created_at_idx ON admin_audit_logs (created_at DESC);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users (id) ON DELETE SET NULL,
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX customers_email_idx ON customers ((lower(email)));
CREATE INDEX customers_phone_idx ON customers (phone);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  label TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'GH',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories (id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories (id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  price NUMERIC(12, 2) NOT NULL,
  sale_price NUMERIC(12, 2),
  currency TEXT NOT NULL DEFAULT 'GHS',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  has_variants BOOLEAN NOT NULL DEFAULT FALSE,
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  seo_title TEXT,
  seo_description TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_price_nonneg CHECK (price >= 0),
  CONSTRAINT products_sale_price_nonneg CHECK (sale_price IS NULL OR sale_price >= 0),
  CONSTRAINT products_sale_lt_price CHECK (sale_price IS NULL OR sale_price < price),
  CONSTRAINT products_currency CHECK (currency = 'GHS')
);

CREATE INDEX products_category_id_idx ON products (category_id);
CREATE INDEX products_active_idx ON products (is_active) WHERE archived_at IS NULL;

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX product_images_product_id_idx ON product_images (product_id);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_override NUMERIC(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT product_variants_price_nonneg CHECK (price_override IS NULL OR price_override >= 0)
);

CREATE INDEX product_variants_product_id_idx ON product_variants (product_id);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id UUID UNIQUE REFERENCES product_variants (id) ON DELETE CASCADE,
  on_hand INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventory_on_hand_nonneg CHECK (on_hand >= 0),
  CONSTRAINT inventory_reserved_nonneg CHECK (reserved >= 0),
  CONSTRAINT inventory_reserved_lte_on_hand CHECK (reserved <= on_hand)
);

CREATE UNIQUE INDEX inventory_product_no_variant_idx
  ON inventory (product_id)
  WHERE variant_id IS NULL;

CREATE TABLE inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES inventory (id) ON DELETE CASCADE,
  delta_on_hand INTEGER NOT NULL DEFAULT 0,
  delta_reserved INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  order_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movements_source CHECK (
    source IN ('sale', 'adjustment', 'reservation', 'reservation_release', 'restock', 'pos_sync')
  )
);

CREATE INDEX inventory_movements_inventory_id_idx ON inventory_movements (inventory_id, created_at DESC);

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers (id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants (id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  CONSTRAINT cart_items_qty_pos CHECK (quantity > 0),
  CONSTRAINT cart_items_unique UNIQUE (cart_id, product_id, variant_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers (id) ON DELETE SET NULL,
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'GH',
  delivery_instructions TEXT,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GHS',
  subtotal NUMERIC(12, 2) NOT NULL,
  shipping_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_delivery_method CHECK (delivery_method IN ('delivery', 'collection')),
  CONSTRAINT orders_status CHECK (
    status IN (
      'pending_payment',
      'paid',
      'packing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    )
  ),
  CONSTRAINT orders_payment_status CHECK (
    payment_status IN ('unpaid', 'pending', 'paid', 'failed')
  ),
  CONSTRAINT orders_money_nonneg CHECK (
    subtotal >= 0 AND shipping_amount >= 0 AND total >= 0
  )
);

CREATE INDEX orders_status_idx ON orders (status, created_at DESC);
CREATE INDEX orders_payment_status_idx ON orders (payment_status);
CREATE INDEX orders_phone_idx ON orders (phone);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id UUID REFERENCES products (id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants (id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL,
  CONSTRAINT order_items_qty_pos CHECK (quantity > 0)
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);

CREATE TABLE order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_ref TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GHS',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_status CHECK (
    status IN ('initialized', 'pending', 'successful', 'failed')
  )
);

CREATE INDEX payments_order_id_idx ON payments (order_id);
CREATE INDEX payments_provider_ref_idx ON payments (provider, provider_ref);

CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments (id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_events_unique UNIQUE (provider, provider_event_id)
);

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region_match TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES shipping_zones (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GHS',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT shipping_rates_amount_nonneg CHECK (amount >= 0)
);

CREATE TABLE store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
