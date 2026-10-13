CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(12, 2) NOT NULL,
  max_discount NUMERIC(12, 2),
  min_spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coupons_code_nonempty CHECK (length(trim(code)) >= 3),
  CONSTRAINT coupons_type CHECK (discount_type IN ('percent', 'fixed')),
  CONSTRAINT coupons_value_pos CHECK (discount_value > 0),
  CONSTRAINT coupons_percent_range CHECK (discount_type <> 'percent' OR discount_value <= 100),
  CONSTRAINT coupons_min_spend_nonneg CHECK (min_spend >= 0),
  CONSTRAINT coupons_uses_nonneg CHECK (uses >= 0),
  CONSTRAINT coupons_max_uses_pos CHECK (max_uses IS NULL OR max_uses > 0)
);

CREATE UNIQUE INDEX coupons_code_upper_idx ON coupons ((upper(code)));
