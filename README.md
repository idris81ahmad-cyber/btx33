# BIYORA SHOP — Premium African Textiles

> **Kwari Market Quality, Delivered.**  
> Modern e-commerce for curated African textiles from Kano’s Kantin Kwari Market.

**Primary live host:** [btx33.vercel.app](https://btx33.vercel.app)  
**Alias:** [biyora-shop.vercel.app](https://biyora-shop.vercel.app) (pin to the same Ready deployment)

---

## Features

### Shopping
- Home, shop (search / filters / sort), product detail (gallery, lengths, reviews, related, recently viewed)
- Persistent cart + wishlist (Zustand), quick view, add-to-cart fly animation
- Checkout with Nigerian states, shipping fee, **coupon codes**, Paystack payment
- Success page with verify + retry
- **Customer order history** (`/account/orders`): delivery timeline, **reorder**, **copy order #**, **invoice download**, support link
- Offline cart via PWA service worker + `localStorage`

### Customer account
- Signup / login (NextAuth credentials)
- `/account` profile + addresses
- Orders linked by **userId + case-insensitive email** (guest checkouts backfilled on login)

### Operations (admin)
- Dashboard: products (quick + full edit, bulk, Blob image upload)
- Orders: search / filter / pagination / bulk status / **CSV export**
- **Sales overview** analytics (revenue, AOV, last 7 days, top products)
- **Review moderation** (approve / reject / delete)
- Protected `/admin` routes (role-based)

### Payments & email
- Paystack: initialize → **pending order** → verify + webhook fulfill (idempotent)
- Webhooks: `/api/paystack/webhook` and alias `/api/webhooks/paystack`
- Order confirmation emails via **Resend** (retries, structured logs)
- Contact form + wholesale inquiry emails
- Coupons: cart + checkout UI, `GET/POST /api/coupons`, server re-validation on pay

### Engineering
- Next.js 15 App Router, TypeScript, Tailwind 4, shadcn/ui, Framer Motion
- Drizzle ORM + Neon / Vercel Postgres, Vercel Blob
- SEO: metadata, sitemap, robots, JSON-LD
- **`next/image` everywhere** for product media (AVIF/WebP, blur, responsive `sizes` + `quality`)
- Health: `GET /api/health`; rate limits; structured `logger` (no raw `console` in app paths)
- Tests: `npm test` (Vitest)
- Optional Sentry (`SENTRY_DSN`); order status history

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

## Environment variables

Copy `.env.example` → `.env.local`, or:

```bash
vercel env pull .env.local
```

### Critical (required)

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_SECRET` | Auth encryption — `node scripts/generate-secret.mjs` |
| `NEXTAUTH_URL` | App origin (`http://localhost:3000` or production URL) |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL (Paystack callback + email links). **Never localhost in Production** |
| `DATABASE_URL` / `POSTGRES_URL` | Neon Postgres connection |
| `PAYSTACK_SECRET_KEY` | Server secret |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Client public key (**same mode** as secret: both test or both live) |

### Recommended (production)

| Variable | Purpose |
|----------|---------|
| **`RESEND_API_KEY`** | **Required for real order emails.** Without it, confirmations run in demo/log mode and `/api/health` shows `email: false` |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `BIYORA SHOP <hello@yourdomain.com>` |
| `CONTACT_INBOX_EMAIL` | Inbox for contact + wholesale notifications |
| `BLOB_READ_WRITE_TOKEN` | Admin product image uploads |

### Optional

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring |
| `GITHUB_TOKEN` | Legacy product JSON fallback |
| `NEXT_PUBLIC_PWA_DEV` | Register SW on localhost |

### Email setup checklist (important)

Production currently needs Resend configured or customers **will not** receive confirmation emails.

1. Create an API key: [resend.com/api-keys](https://resend.com/api-keys)
2. Verify a sending domain (or use `onboarding@resend.dev` only for sends to *your* Resend account email)
3. In **Vercel → Project → Settings → Environment Variables** (Production + Preview):

```
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=BIYORA SHOP <hello@your-verified-domain.com>
CONTACT_INBOX_EMAIL=hello@your-domain.com
```

4. **Redeploy** after adding vars
5. Confirm:

```bash
# flags.email must be true
curl -s https://btx33.vercel.app/api/health
```

6. Smoke-test without charging Paystack:

```bash
vercel env pull .env.local
npm run test:order-email you@example.com
# or simple ping:
npm run test:email you@example.com
```

7. Place a small Paystack **test-mode** order → check inbox (and spam)

---

## Getting started

```bash
git clone https://github.com/idris81ahmad-cyber/biyora-shop.git
cd biyora-shop
npm install
cp .env.example .env.local   # or: vercel env pull .env.local
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run lint
npm run typecheck
npm test                               # Vitest unit tests
npm run build
npm run test:email you@example.com     # Resend ping
npm run test:order-email you@…         # Full order-confirmation HTML
npm run db:setup
node scripts/test-webhook.mjs
node scripts/debug-payment.mjs [ref]
node scripts/debug-order-link.mjs
```

---

## Deployment (Vercel)

### First-time / production

1. Import the GitHub repo → Framework: **Next.js**
2. Set **all critical env vars** (Production). Set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to the live host (e.g. `https://btx33.vercel.app`)
3. Connect Neon (or paste `DATABASE_URL` / `POSTGRES_URL`)
4. Connect Vercel Blob for image uploads
5. Add **Resend** vars (see email checklist above) — **do not skip**
6. Deploy, then apply schema:

```bash
vercel env pull .env.local
npm run db:setup
```

7. Paystack Dashboard → Webhooks:

```
https://YOUR-DOMAIN/api/paystack/webhook
# alias:
https://YOUR-DOMAIN/api/webhooks/paystack
```

Signature: HMAC-SHA512 of raw body with `PAYSTACK_SECRET_KEY`.

8. Verify:

```bash
curl -s https://YOUR-DOMAIN/api/health
# expect: ok true, flags.database, paystack, nextAuth, email, blob

curl -s https://YOUR-DOMAIN/api/paystack/webhook
```

### Production checklist

| Check | How |
|-------|-----|
| Health OK | `GET /api/health` → `ok: true` |
| **Email ready** | `flags.email: true` |
| Paystack same mode | both keys test **or** both live |
| Site URL not localhost | `NEXT_PUBLIC_SITE_URL` on Vercel |
| Webhook registered | Paystack hits live path |
| DB seeded | admin login + products |
| Order history | logged-in test order → `/account/orders` |
| Confirmation email | test order or `npm run test:order-email` |

Prefer **one** production domain. Pin `biyora-shop` and `btx33` aliases to the same Ready deployment.

---

## Order & email flow

```
Checkout (prefer logged-in)
  → POST /api/paystack/initialize
      pending order (userId + email)
  → Paystack payment
  → /checkout/success?reference=… → POST /api/paystack/verify
  → (also) POST /api/paystack/webhook
  → fulfillPaystackPayment (idempotent)
      pending → confirmed
      stock deduct
      sendOrderConfirmation (Resend, up to 3 retries)
  → /account/orders
```

Without `RESEND_API_KEY`, email is **demo-only** (logged, not delivered).

---

## Coupons

| Code | Offer | Min subtotal |
|------|--------|--------------|
| `KWARI10` | 10% off | ₦25,000 |
| `BIYORA5000` | ₦5,000 off | ₦50,000 |
| `FABRIC15` | 15% off | ₦75,000 |

Cart → optional apply → checkout re-apply → **server validates** in `/api/paystack/initialize`.

API: `GET /api/coupons` (list), `POST /api/coupons` `{ code, subtotal }` (validate).

---

## Images

All product surfaces use `components/ProductImage.tsx` → **`next/image`**:

| Surface | Typical `sizes` | Quality |
|---------|-----------------|---------|
| Product cards | `(max-width: 640px) 100vw, … 16vw` | 75–85 |
| PDP main gallery | `(max-width: 1024px) 100vw, 50vw` | 88 |
| Lightbox | `95vw` / `1200px` | 90 |
| Thumbs / cart / orders | `56px`–`112px` | 80 default |
| Logos | `36px` | default |

Config (`next.config.ts`): AVIF/WebP, Blob remote patterns, long cache TTL.

---

## Admin

- `/admin` (login `/admin/login`)
- Rotate seed credentials in production
- Orders, products, **sales overview**, review moderation

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| **No confirmation email** | `RESEND_API_KEY` missing (`flags.email: false`) | Add Resend env on Vercel, redeploy, `test:order-email` |
| Email fails only for customers | Using `onboarding@resend.dev` | Verify domain + set `RESEND_FROM_EMAIL` |
| Payment OK, success errors | Wrong host / missing DB | Use host with healthy `/api/health` |
| Webhook 404 | Wrong path | `/api/paystack/webhook` or `/api/webhooks/paystack` |
| Order missing from history | Different login email / stale alias | Same email as checkout; current deploy |
| Amount mismatch | Coupon/cart drift | Re-apply coupon before pay |
| Test vs live Paystack mix | Key mode mismatch | Both test or both live |

---

## Project structure

```
app/                 # Pages + API routes
components/          # UI, admin, ProductImage, EmptyState, timelines
lib/                 # auth, db, paystack, coupons, email, invoice, reorder, logger
drizzle/             # SQL migrations
scripts/             # db-setup, test-email, send-test-order-email, debug-*
public/images/       # Product assets
tests/               # Vitest critical-path tests
```

---

## License

See [LICENSE](./LICENSE).
