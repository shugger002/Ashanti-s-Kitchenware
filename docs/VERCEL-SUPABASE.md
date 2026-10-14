# Vercel + Supabase

Legal name: **Ashanti's Kitchenware**. Public hostname: `ashantisakitchenware.com`.

The app still talks to Postgres with `pg` (no Prisma, no Supabase client SDK, no change to Hubtel/Moolre). Vercel runs the Next.js server. Supabase is the Postgres database and the S3-compatible photo bucket.

## 1. Supabase project

1. Create a project in [Supabase](https://supabase.com/dashboard) (Frankfurt `eu-central-1` matches the Vercel `fra1` region).
2. Open **Project Settings → Database**.
3. Copy two URIs (URI, not JDBC):
   - **Transaction pooler** (port `6543`) → `DATABASE_URL` on Vercel. This is what the shop uses at runtime.
   - **Session pooler** or **Direct connection** (port `5432`) → `DIRECT_URL` on your laptop. Migrations and `db:bootstrap` use this.
4. Append `?sslmode=require` if the URI does not already include SSL.

Do not paste the `anon` or `service_role` API keys into this app. Those are for the Supabase HTTP APIs, which this codebase does not call.

## 2. Schema and first staff user

From this repo, with `DIRECT_URL` (or `DATABASE_URL`) and `DATABASE_SSL=true` in `.env`:

```bash
npm run db:migrate
BOOTSTRAP_ADMIN_PASSWORD='choose-a-long-password' npm run db:bootstrap
```

The bootstrap script refuses passwords shorter than 12 characters and will not create a second user with the same email.

## 3. Product photographs (Supabase Storage)

Local disk uploads are not available on Vercel. Use a public Storage bucket:

1. **Storage → New bucket** named `product-images`, public.
2. **Project Settings → Storage** (S3 connection): copy Access Key, Secret, endpoint, and region.
3. Set:

```
S3_ENDPOINT=https://<project-ref>.storage.supabase.co/storage/v1/s3
S3_REGION=<region from the Storage S3 settings>
S3_BUCKET=product-images
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_BASE_URL=https://<project-ref>.supabase.co/storage/v1/object/public/product-images
```

If the S3 endpoint in the dashboard uses a different host, use the dashboard value.

## 4. Vercel project

1. Import `https://github.com/Shugger001/ashantis-kitchenware` (or this git remote) in Vercel.
2. Framework: Next.js. Region: `fra1` (set in `vercel.json`).
3. Production env (also add to Preview if you want working preview checkouts):

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Transaction pooler URI |
| `DATABASE_SSL` | `true` |
| `APP_URL` | `https://ashantisakitchenware.com` (or the `*.vercel.app` URL until DNS is pointed) |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `SESSION_COOKIE_NAME` | `ak_session` |
| `CUSTOMER_SESSION_COOKIE_NAME` | `ak_customer_session` |
| `S3_*` | From step 3 |
| Hubtel / Moolre / SMTP | Only when those accounts exist |

Leave payment keys empty to keep orders pending until staff record a verified payment.

4. After the first deploy, add the custom domain `ashantisakitchenware.com` and set `APP_URL` to `https://ashantisakitchenware.com`. Hubtel and Moolre callbacks must use that host.

Webhook paths are unchanged: `/api/webhooks/hubtel` and the existing Moolre return URLs.

## 5. What this stack does not use

- Supabase Auth, Edge Functions, or Row Level Security policies. Staff and customer sessions stay in this app’s cookies and `sessions` / `customer_sessions` tables.
- Hostinger VPS / Nginx. That runbook remains in [HOSTINGER.md](./HOSTINGER.md) if you ever need a fallback.
