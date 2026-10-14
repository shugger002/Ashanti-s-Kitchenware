# Ashanti's Kitchenware

Production-oriented Next.js storefront and admin for `ashantisakitchenware.com`.

PostgreSQL is used directly through `pg` (no Prisma or Drizzle). Production hosting is **Vercel**; production Postgres and product photos are **Supabase**. Payments go through Hubtel and Moolre when those keys exist; otherwise orders stay pending until staff record a verified payment.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` plus `SESSION_SECRET`.
2. Create a PostgreSQL database.
3. `npm install`
4. `npm run db:migrate`
5. `BOOTSTRAP_ADMIN_PASSWORD='choose-a-long-password' npm run db:bootstrap`
6. `npm run dev`

Open `/` for the store, `/login` for customer accounts (optional), and `/admin/login` for staff.

Demo logo (`/logo.jpg`) and product photographs (`/public/demo`) are included for layout. They are labelled as placeholders. Run `npm run db:migrate` to load the demo catalogue into Postgres; without a database the shop still shows those photos from a static fallback.

Contact details and policy wording were transcribed from ashantiskitchenware.com. Do not treat demo prices or photos as live stock.

## Scripts

- `npm run typecheck`
- `npm run test` — inventory availability checks
- `npm run build`

Hosting: [docs/VERCEL-SUPABASE.md](docs/VERCEL-SUPABASE.md). Older VPS notes: [docs/HOSTINGER.md](docs/HOSTINGER.md).
