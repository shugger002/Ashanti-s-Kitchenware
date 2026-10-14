-- Reviews stay off the storefront until staff publish them.
ALTER TABLE product_reviews
  ALTER COLUMN is_published SET DEFAULT FALSE;

UPDATE product_reviews SET is_published = FALSE WHERE is_published = TRUE;
