# BIYORA SHOP — Premium African Textiles

> **Kwari Market Quality, Delivered.**  
> Modern e-commerce for curated African textiles from Kano’s Kantin Kwari Market.

**Live:** [biyora-shop.vercel.app](https://biyora-shop.vercel.app) · also [btx33.vercel.app](https://btx33.vercel.app) (same project)

---

## Features

### Shopping
- Home, shop (search / filters / sort), product detail (gallery, lengths, reviews, related, recently viewed)
- Persistent cart + wishlist (Zustand), quick view, add-to-cart fly animation
- Checkout with Nigerian states, shipping fee, **coupon codes**, Paystack payment
- Success page with verify + retry; **customer order history** with delivery timeline, reorder, support
- Offline cart via PWA service worker + `localStorage`

### Customer account
- Signup / login (NextAuth credentials)
- `/account` profile + addresses
- `/account/orders` — premium order history (status filters, copy order #, shipping details)
- Orders linked by **userId + case-insensitive email** (guest checkouts backfilled on login)

### Operations (admin)
- Dashboard: products (quick + full edit, bulk actions, Blob image upload)
- Orders: search / filter / pagination / bulk status / **CSV export**
- Analytics: revenue, orders today, open pipeline, top products
- Review moderation
- Protected `/admin` routes (role-based)

### Payments & email
- Paystack: initialize → **pending order** → verify + webhook fulfill (idempotent)
- Webhook paths: `/api/paystack/webhook` and alias `/api/webhooks/paystack`
- Order confirmation emails via **Resend** (retries, structured logs, demo mode without key)
- Contact form + wholesale inquiry emails

### Engineering
- Next.js 15 App Router, TypeScript, Tailwind 4, shadcn/ui, Framer Motion
- Drizzle ORM + Neon / Vercel Postgres, Vercel Blob uploads
- SEO: metadata, sitemap, robots, JSON-LD
- `next/image` product images (AVIF/WebP, blur placeholders, responsive `sizes`)
- Health: `GET /api/health`; rate limits on Paystack + signup; structured logging
- Tests: `npm test` (Vitest — coupons, webhook signature, rate limit, order status)
- Optional Sentry (`SENTRY_DSN`); order status history table

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
# Or pull from Vercel:
vercel env pull .env.local
```

**Critical variables**

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_SECRET` | Auth encryption (`node scripts/generate-secret.mjs`) |
| `NEXTAUTH_URL` | e.g. `http://localhost:3000` or production URL |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (Paystack callback + email links) |
| `DATABASE_URL` / `POSTGRES_URL` | Neon Postgres |
| `PAYSTACK_SECRET_KEY` | Server secret |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Client public key (**same mode** as secret) |

**Recommended**

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Order + contact emails |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `BIYORA SHOP <hello@yourdomain.com>` |
| `CONTACT_INBOX_EMAIL` | Inbox for contact + wholesale notifications |
| `BLOB_READ_WRITE_TOKEN` | Admin image uploads |

See `.env.example` for the full list.

### 3. Database setup

```bash
npm run db:setup
# optional force product seed:
npm run db:setup -- --force-products
```

This applies schema (including `order_status_history` when present) and seeds admin users / products as needed.

### 4. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Scripts

```bash
npm run lint
npm run typecheck
npm test                               # Vitest unit tests
npm run build
npm run test:email you@example.com     # Resend delivery smoke test
node scripts/test-webhook.mjs          # signature + health helpers
node scripts/debug-payment.mjs [ref]   # Paystack + DB diagnostics
node scripts/debug-order-link.mjs      # order ↔ user linking diagnostics
```

---

## Deployment (Vercel)

### First-time setup

1. **Import** the GitHub repo → Framework preset: **Next.js**.
2. **Environment variables** (Production + Preview as needed):
   - Set all **critical** vars above.
   - **`NEXT_PUBLIC_SITE_URL` must be the live domain** (never `localhost` in Production).
   - **`NEXTAUTH_URL`** should match the same production origin.
3. **Database:** connect Neon (or paste `DATABASE_URL` / `POSTGRES_URL`).
4. **Blob (optional but recommended):** connect Vercel Blob for product image uploads.
5. Deploy, then run schema against production:

```bash
# With production env available locally:
vercel env pull .env.local
npm run db:setup
```

6. **Paystack Dashboard → Webhooks** (Settings → API Keys & Webhooks):

```
https://YOUR-DOMAIN/api/paystack/webhook
# alias also works:
https://YOUR-DOMAIN/api/webhooks/paystack
```

Signature is HMAC-SHA512 of the raw body with `PAYSTACK_SECRET_KEY`.

7. **Resend**
   - Create API key → `RESEND_API_KEY`
   - Verify a sending domain → set `RESEND_FROM_EMAIL` to that domain  
     (`onboarding@resend.dev` only delivers to your Resend account email)
   - Smoke test: `npm run test:email your@email.com`

8. **Verify deploy**

```bash
curl -s https://YOUR-DOMAIN/api/health
# flags: database, paystack, nextAuth, email, blob

curl -s https://YOUR-DOMAIN/api/paystack/webhook
# webhook health (GET)
```

### Domains

Prefer a **single** production host. If both `biyora-shop.vercel.app` and `btx33.vercel.app` point at this project, pin aliases to the same **Ready** deployment so cookies, Paystack callbacks, and order history stay consistent.

### Production checklist

| Check | How |
|-------|-----|
| Health OK | `GET /api/health` → `ok: true` |
| Paystack keys same mode | both test **or** both live |
| Site URL not localhost | `NEXT_PUBLIC_SITE_URL` on Vercel |
| Webhook registered | Paystack dashboard hits live path |
| Email domain verified | Resend + `RESEND_FROM_EMAIL` |
| DB seeded | admin can log in; products appear |
| Order history | place test order logged-in → `/account/orders` |

---

## Coupons (checkout)

| Code | Offer | Min subtotal |
|------|--------|--------------|
| `KWARI10` | 10% off | ₦25,000 |
| `BIYORA5000` | ₦5,000 off | ₦50,000 |
| `FABRIC15` | 15% off | ₦75,000 |

Validated client-side for UX and **re-validated server-side** in `/api/paystack/initialize`.

---

## Order & email flow

```
Checkout (logged-in preferred)
  → POST /api/paystack/initialize
      creates pending order (userId + email)
      returns Paystack authorization_url
  → Customer pays on Paystack
  → Redirect /checkout/success?reference=…
      POST /api/paystack/verify
  → Webhook may also POST /api/paystack/webhook
  → fulfillPaystackPayment (idempotent)
      pending → confirmed
      stock deduct
      sendOrderConfirmation (Resend, up to 3 retries)
  → Customer sees order in /account/orders
```

Without `RESEND_API_KEY`, confirmations run in **demo mode** (logged, not emailed). Health flag `email` reflects key presence.

---

## Admin

- URL: `/admin` (login `/admin/login`)
- Rotate seed/legacy admin credentials in production.
- **Orders:** filters, bulk status, CSV export, analytics.
- **Products:** quick edit vs full edit (images / specs).
- **Reviews:** moderation queue.

---

## Images

Product UI uses `components/ProductImage.tsx` (wraps `next/image`):

- AVIF / WebP via `next.config.ts`
- Blur placeholder for textile assets
- Responsive `sizes` on cards, gallery, cart, order history, logos
- Remote patterns for Vercel Blob hosts
- Fallback to `/images/ankara-premium.jpg` on load error

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Payment OK, success page errors | Stale domain / missing DB on that host | Use host with working `/api/health`; set `NEXT_PUBLIC_SITE_URL` |
| `Database not configured` | Missing `POSTGRES_URL` / `DATABASE_URL` | Add Neon vars; redeploy |
| Webhook 404 | Wrong path | Use `/api/paystack/webhook` or `/api/webhooks/paystack` |
| No confirmation email | Missing key, unverified domain, or onboarding sender | Set `RESEND_*`; `npm run test:email` |
| Order not in history | Wrong login email / stale host | Sign in with checkout email; refresh; use current deploy |
| Amount mismatch on pay | Coupon/total out of sync | Re-apply coupon; don’t change cart after apply |
| Admin product edit fails | Older deploy without PATCH | Redeploy latest; `PATCH` `/api/admin/products/:id` |
| Test vs live Paystack mix | Public/secret mode mismatch | Both keys test **or** both live |

**Health check**

```bash
curl -s https://YOUR-DOMAIN/api/health | jq
# flags: database, paystack, nextAuth, email, blob
```

---

## Project structure (high level)

```
app/                 # Pages + API routes
components/          # UI, admin, ProductImage, order timeline
lib/                 # auth, db, paystack, coupons, email, env, rate-limit, logger
drizzle/             # SQL migrations
scripts/             # db-setup, test-email, debug-payment, test-webhook
public/images/       # Product assets
tests/               # Vitest critical-path tests
```

---

## License

See [LICENSE](./LICENSE).
