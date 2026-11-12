INSERT INTO roles (slug, name) VALUES
  ('developer', 'Developer')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO user_roles (user_id, role_slug)
SELECT u.id, 'developer'
  FROM users u
 WHERE lower(u.email) = 'admin@ashantisakitchenware.com'
ON CONFLICT DO NOTHING;
