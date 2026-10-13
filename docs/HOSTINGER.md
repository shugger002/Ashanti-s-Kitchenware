# Hostinger VPS runbook

Legal name: **Ashanti's Kitchenware**. Public hostname: `ashantisakitchenware.com`.

Nothing here assumes a plan has already been purchased. Verify each item before launch.

## Required services

- Ubuntu 22.04/24.04 VPS with a non-root sudo user
- Node.js 20 LTS (`node -v`)
- PostgreSQL 16 (on-box or Hostinger managed) with TLS in production (`DATABASE_SSL=true`)
- Nginx reverse proxy and Let's Encrypt
- S3-compatible object storage for product images (Hostinger Object Storage, Cloudflare R2, or AWS). Do not keep catalogue photos only on the VPS disk.
- Optional SMTP for password reset, order mail, and the contact form
- Optional Hubtel and Moolre live keys

## First-time server

```bash
sudo adduser --system --group --home /var/www/ashantis-kitchenware ashantisa
sudo mkdir -p /var/www/ashantis-kitchenware
sudo chown ashantisa:ashantisa /var/www/ashantis-kitchenware
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

Create the database (on-box example):

```bash
sudo -u postgres psql -c "CREATE USER ashantisa WITH PASSWORD 'choose-a-long-password';"
sudo -u postgres psql -c "CREATE DATABASE ashantisa OWNER ashantisa;"
```

## Environment

Copy `.env.production.example` to `/var/www/ashantis-kitchenware/.env`. Never commit that file.

Set:

- `NODE_ENV=production`
- `APP_URL=https://ashantisakitchenware.com`
- `APP_NAME=Ashanti's Kitchenware`
- `DATABASE_URL` and `DATABASE_SSL=true`
- `SESSION_SECRET` of 32+ random bytes (`openssl rand -base64 48`)
- S3 variables before uploading live product photos
- SMTP, Hubtel, and Moolre only when those accounts exist

## Deploy

From the project on your laptop, rsync or git-clone onto the VPS, then:

```bash
cd /var/www/ashantis-kitchenware
sudo -u ashantisa npm ci
sudo -u ashantisa npm run db:migrate
sudo -u ashantisa env BOOTSTRAP_ADMIN_PASSWORD='...' npm run db:bootstrap
sudo -u ashantisa npm run build
```

The bootstrap script refuses passwords shorter than 12 characters and will not create a second user with the same email.

Install the process unit:

```bash
sudo cp deploy/ashantis-kitchenware.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ashantis-kitchenware
sudo systemctl status ashantis-kitchenware
```

`npm start` listens on port 3000. Do not expose 3000 on the public firewall.

## TLS and Nginx

1. Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/ashantisakitchenware.com`.
2. Obtain certificates (HTTP server block first, or use certbot nginx plugin):

```bash
sudo ln -s /etc/nginx/sites-available/ashantisakitchenware.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d ashantisakitchenware.com -d www.ashantisakitchenware.com
sudo systemctl reload nginx
```

Redirect www → apex. Enable HTTP/2. Open 80/443 only.

Point DNS A records for `ashantisakitchenware.com` and `www` at the VPS before cutting over the old site.

## Payments

Leave Hubtel and Moolre keys empty until those accounts exist. Checkout still creates `pending_payment` orders. Staff record a verified payment from the order screen with a provider reference.

When Hubtel is enabled, set its callback URL to `https://ashantisakitchenware.com/api/webhooks/hubtel`. When Moolre is enabled, set its payment callback URL to `https://ashantisakitchenware.com/api/webhooks/moolre` and store `MOOLRE_WEBHOOK_SECRET`.

## Updates

```bash
cd /var/www/ashantis-kitchenware
sudo -u ashantisa git pull
sudo -u ashantisa npm ci
sudo -u ashantisa npm run db:migrate
sudo -u ashantisa npm run build
sudo systemctl restart ashantis-kitchenware
```

## Smoke checklist

- Homepage, shop, category, product, about, contact, policy URLs each have their own title and canonical
- Empty catalogue does not invent ratings or bestsellers
- Guest cart survives refresh
- Customer register / sign-in / sign-out / account orders
- Checkout as collection succeeds; delivery is blocked until a shipping rate is saved
- Success page does not mark the order paid
- Admin login is rate-limited; `/admin` redirects when signed out
- Image upload rejects non-images
- `x-powered-by` is absent
- Cookie banner and footer “Cookie settings” both change consent
