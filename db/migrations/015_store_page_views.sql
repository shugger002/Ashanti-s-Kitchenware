CREATE TABLE store_page_views (
  id BIGSERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  visitor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT store_page_views_path_slash CHECK (path LIKE '/%')
);

CREATE INDEX store_page_views_created_at_idx ON store_page_views (created_at DESC);
CREATE INDEX store_page_views_path_idx ON store_page_views (path);
