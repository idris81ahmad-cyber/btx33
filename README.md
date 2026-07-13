# BIYORA SHOP — Premium African Textiles

> **Kwari Market Quality, Delivered.**  
> Modern e-commerce for curated African textiles from Kano’s Kantin Kwari Market.

**Live:** [biyora-shop.vercel.app](https://biyora-shop.vercel.app) · also [btx33.vercel.app](https://btx33.vercel.app) (same project)

---

## Features

### Shopping
- Home, shop (search/filters/sort), product detail (gallery, lengths, reviews, related)
- Persistent cart + wishlist (Zustand), quick view, recently viewed
- Checkout with Nigerian states, shipping fee, **coupon codes**, Paystack payment
- Order success with verification + retry; order history in account

### Operations
- Admin dashboard: products (quick + full edit, bulk actions), orders (search/filter/pagination/bulk status/**CSV export**)
- Admin analytics: revenue, orders today, open pipeline, top products
- Auth (NextAuth): customer signup/login, admin role, protected routes
- Paystack: initialize → pending order → verify + webhook fulfill
- Email: order confirmation + contact (Resend)
- Wholesale inquiry, fabric calculator, journal, FAQ, about, contact

### Engineering
- Next.js 15 App Router, TypeScript, Tailwind 4, shadcn/ui
- Drizzle + Neon/Vercel Postgres, Vercel Blob uploads
- SEO: metadata, sitemap, robots, JSON-LD
- Health: `GET /api/health`, webhook health `GET /api/paystack/webhook`
- Rate limits on paystack + signup; structured logging

---

## Tech stack

| Area | Stack |
|------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Framer Motion |
| State | Zustand (persist) |
| DB | Drizzle ORM + Neon / `@vercel/postgres` |
| Auth | NextAuth v4 (credentials) |
| Payments | Paystack |
| Email | Resend |
| Files | Vercel Blob |
| Deploy | Vercel |

---

## Getting started

### 1. Clone & install

```bash
git clone https://github.com/idris81ahmad-cyber/biyora-shop.git
cd biyora-shop
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
# Or pull from Vercel: vercel env pull .env.local
```

**Critical variables**

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_SECRET` | Auth encryption (`node scripts/generate-secret.mjs`) |
| `NEXTAUTH_URL` | e.g. `http://localhost:3000` or production URL |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (Paystack callback) |
| `DATABASE_URL` / `POSTGRES_URL` | Neon Postgres |
| `PAYSTACK_SECRET_KEY` | Server secret |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Client public key (same mode as secret) |

**Recommended**

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Order + contact emails |
| `RESEND_FROM_EMAIL` | Verified sender |
| `BLOB_READ_WRITE_TOKEN` | Admin image uploads |

See `.env.example` for full list and comments.

### 3. Database setup

```bash
npm run db:setup
# optional force product seed:
npm run db:setup -- --force-products
```

### 4. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Scripts

```bash
npm run lint
npm run typecheck
npm run build
node scripts/test-webhook.mjs          # signature + health helpers
node scripts/debug-payment.mjs [ref]   # Paystack + DB diagnostics
```

---

## Deployment (Vercel)

1. Import the GitHub repo → Framework: Next.js.
2. Set env vars (Production + Preview as needed).  
   **`NEXT_PUBLIC_SITE_URL` must be your live domain** (not localhost).
3. Connect Neon (or set `DATABASE_URL` / `POSTGRES_URL`).
4. After first deploy: run `npm run db:setup` against production DB (or use a one-off job).
5. Paystack Dashboard → Webhooks:

```
https://YOUR-DOMAIN/api/paystack/webhook
# alias also works:
https://YOUR-DOMAIN/api/webhooks/paystack
```

6. Verify:

```
GET https://YOUR-DOMAIN/api/health
GET https://YOUR-DOMAIN/api/paystack/webhook
```

Prefer a **single** production domain. If both `biyora-shop.vercel.app` and `btx33.vercel.app` exist, pin aliases to the same Ready deployment.

---

## Coupons (checkout)

| Code | Offer | Min subtotal |
|------|--------|--------------|
| `KWARI10` | 10% off | ₦25,000 |
| `BIYORA5000` | ₦5,000 off | ₦50,000 |
| `FABRIC15` | 15% off | ₦75,000 |

Validated client-side for UX and **re-validated server-side** in `/api/paystack/initialize`.

---

## Admin

- URL: `/admin` (login `/admin/login`)
- Default legacy admin may exist from seed — rotate credentials in production.
- **Orders:** filters, bulk status, CSV export, analytics cards.
- **Products:** quick edit vs full edit (images/specs).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Payment OK, success page errors | Stale domain / missing DB on that host | Use host with working `/api/health`; set `NEXT_PUBLIC_SITE_URL` |
| `Database not configured` | Missing `POSTGRES_URL` / `DATABASE_URL` | Add Neon vars; redeploy |
| Webhook 404 | Wrong path | Use `/api/paystack/webhook` or `/api/webhooks/paystack` |
| No confirmation email | No `RESEND_API_KEY` or unverified domain | Set key + verify domain in Resend |
| Amount mismatch on pay | Coupon/total out of sync | Re-apply coupon; ensure cart unchanged after apply |
| Admin product edit fails | Was using unsupported PATCH | Current build supports `PATCH` `/api/admin/products/:id` |
| Test vs live Paystack mix | Public/secret mode mismatch | Both keys test **or** both live |

**Health check JSON**

```bash
curl -s https://YOUR-DOMAIN/api/health | jq
# flags: database, paystack, nextAuth, email, blob
```

---

## Project structure (high level)

```
app/                 # Pages + API routes
components/          # UI, admin (ProductManager, OrderManager, AdminAnalytics)
lib/                 # auth, db, paystack, coupons, email, env, rate-limit
drizzle/             # SQL migrations
scripts/             # db-setup, debug-payment, test-webhook
public/images/       # Product assets
```

---

## License

See [LICENSE](./LICENSE).
