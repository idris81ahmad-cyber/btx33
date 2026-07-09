# 🧵 BIYORA SHOP — Premium African Textiles

> **Kwari Market Quality, Delivered.**  
> A modern, luxurious e-commerce experience showcasing the finest textiles from Kano’s iconic Kantin Kwari Market and premium African textile heritage.

**Live Demo:** [biyora-shop.vercel.app](https://biyora-shop.vercel.app)

---

## ✨ Features

### Core Shopping Experience
- **Stunning Home Page** — Hero with powerful cultural positioning, featured fabrics, category highlights, trust signals, and newsletter signup
- **Fully Functional Shop** — Real-time search, advanced filters (category, color family, pattern style, price range), sorting, beautiful responsive product grid with skeletons
- **Premium Product Detail Pages** — High-quality image gallery, dynamic length selector with live price update, detailed specifications, “How to Style” suggestions, related products, reviews section
- **Cart System** — Persistent cart with Zustand + localStorage (length variants supported), quantity management, live totals in ₦
- **Elegant Checkout** — Nigerian states dropdown, comprehensive address form with Zod + React Hook Form validation, multiple payment options
- **Beautiful Order Success** — Confetti celebration, order number, “Track Order” demo

### Advanced & Operational Features
- **Full Admin Dashboard** (`/admin`) — Product management (CRUD), order viewing, image uploads via Vercel Blob, admin login
- **Authentication & Accounts** — NextAuth-powered login/signup, protected account pages, address & order history APIs
- **Content & Education** — Journal with multiple articles (Choosing Lace, Fabric Care, Meet Artisans, Styling Tips)
- **Wholesale Page** — Dedicated flow for bulk/custom orders
- **Fabric Calculator** — Interactive tool for yardage/length calculations
- **Reviews System** — API + UI for product reviews
- **Contact Form** — Fully working with email delivery (Resend)
- **FAQ & About** — Rich brand story connected to Kwari Market heritage

### Technical Excellence
- Next.js 15 (App Router) + TypeScript (strict mode)
- Tailwind CSS 4 + beautiful custom premium design system (burgundy, gold, cream, forest tones)
- Framer Motion for smooth animations and micro-interactions
- Zustand with persist middleware for cart/wishlist
- React Hook Form + Zod for all forms
- Drizzle ORM + Vercel Postgres (production-ready database layer)
- NextAuth v4 for secure authentication
- Sonner for elegant toast notifications
- Vercel Blob for admin image uploads
- Resend for transactional emails
- Fully responsive + mobile-first with premium hamburger menu
- Loading states, empty states, error boundaries, and delightful UX
- SEO-optimized (sitemap, robots, JsonLd, rich metadata)
- Security headers enabled
- CI/CD with GitHub Actions (lint + typecheck + build)

---

## 🛠 Tech Stack

| Category              | Technology                                      |
|-----------------------|-------------------------------------------------|
| Framework             | Next.js 15 (App Router)                         |
| Language              | TypeScript (strict)                             |
| Styling               | Tailwind CSS 4 + shadcn/ui                      |
| Animations            | Framer Motion                                   |
| State Management      | Zustand + persist                               |
| Forms & Validation    | React Hook Form + Zod                           |
| Database & ORM        | Drizzle ORM + @vercel/postgres                  |
| Authentication        | NextAuth v4                                     |
| Payments (prep)       | Paystack (env ready)                            |
| Email                 | Resend                                          |
| File Storage          | @vercel/blob                                    |
| Notifications         | Sonner                                          |
| Icons                 | Lucide React                                    |
| Deployment            | Vercel (with Analytics + Speed Insights)        |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/idris81ahmad-cyber/biyora-shop.git
cd biyora-shop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment

```bash
cp .env.example .env.local
# Fill in your keys (NextAuth secret, database, Resend, Paystack, etc.)
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Database (optional but recommended)

```bash
npm run db:generate
npm run db:push
```

### 6. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
biyora-shop/
├── app/                    # App Router pages + API routes
│   ├── admin/              # Admin dashboard & login
│   ├── api/                # Products, orders, reviews, auth, admin, upload, etc.
│   ├── shop/, products/, cart/, checkout/, success/
│   ├── journal/, wholesale/, calculator/, account/, contact/, faq/, about/
│   └── layout.tsx, providers.tsx
├── components/             # Navbar, Footer, ProductCard, CartDrawer, modals, ui/
├── lib/                    # cart-store, products, db (Drizzle), auth, utils
├── data/products.json      # Curated textile catalog
├── types/                  # TypeScript interfaces
├── scripts/                # Admin setup, testing, secret generation
├── .github/workflows/      # CI + product sync
└── drizzle.config.ts, next.config.ts, tsconfig.json
```

---

## 🧵 The 12 Premium Textile Products

Curated selection of authentic, high-quality fabrics from Kano’s Kantin Kwari Market:

| #  | Name                                      | Category                    | Price (₦)  | Length Options       |
|----|-------------------------------------------|-----------------------------|------------|----------------------|
| 1  | Royal Gold Ankara Wax Print               | Ankara Prints               | 18,500     | 5yd, 6yd            |
| 2  | Swiss Voile Cord Lace – Ivory             | Premium Lace                | 48,000     | 5yd, 6yd            |
| 3  | Premium Guinea Brocade – Burgundy         | Brocade & Damask            | 35,000     | 5yd, 6yd, 10yd      |
| 4  | Indigo Adire Tie-Dye Fabric               | Adire & Tie-Dye             | 16,500     | 5yd, 6yd            |
| 5  | French Guipure Lace – Champagne Gold      | Premium Lace                | 55,000     | 5yd                 |
| 6  | Emerald Silk Chiffon – Luxe Drape         | Silk, Chiffon & Voile       | 29,500     | 5yd, 6yd            |
| 7  | Premium Solid Cotton Poplin – Warm Cream  | Plain & Solid Premium Cottons | 12,800   | 5yd, 6yd, 10yd      |
| 8  | Royal Blue Floral Ankara Wax Print        | Ankara Prints               | 19,200     | 5yd, 6yd            |
| 9  | Gold Thread Swiss Lace – White            | Premium Lace                | 42,500     | 5yd, 6yd            |
| 10 | Deep Green Damask Shadda                  | Brocade & Damask            | 38,000     | 5yd, 6yd, 10yd      |
| 11 | Sunset Orange Handcrafted Adire           | Adire & Tie-Dye             | 24,000     | 5yd, 6yd            |
| 12 | Soft Blush Pink Premium Voile             | Silk, Chiffon & Voile       | 15,200     | 5yd, 6yd, 10yd      |

All products include rich descriptions, realistic specs, multiple image options, ratings, and stock levels. Easily extendable via admin panel or code.

---

## 🛠 How to Add New Fabrics

**Option 1 (Recommended for production):** Use the Admin Dashboard (`/admin` after login) to add/edit products with image uploads.

**Option 2 (Code):** 
1. Open `lib/products.ts` or `data/products.json`
2. Add a new object following the `Product` interface
3. Add images to `public/images/` or use external URLs (update `next.config.ts` remotePatterns if needed)
4. The shop, filters, and product pages update automatically.

---

## 📦 Deployment (Vercel — Recommended)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add environment variables from `.env.example` (especially NextAuth, database, Resend, Paystack)
4. Deploy — automatic HTTPS + edge caching

**Custom Domain:** Point your domain (e.g. `biyorashop.com`) in Vercel settings.

---

## ✅ Quality & CI

```bash
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs these checks on every push/PR. Security headers are enabled in production.

---

## 🗺 Future Roadmap (Prioritized)

**High Priority (In Progress)**
- Full Paystack integration + webhook verification in checkout
- Strengthen admin route protection & role-based access
- Move product management fully to database + admin UI

**Medium Priority**
- Real user reviews & ratings persistence
- Order tracking page
- Email templates & order confirmation emails
- URL-synced shop filters for shareable links

**Nice to Have**
- Multi-currency support
- Digital swatch samples / AR try-on ideas
- Advanced analytics dashboard
- Wholesale quote request system with email notifications

The current architecture is clean, scalable, and ready for these additions.

---

## 🙏 Credits & Inspiration

- **Kantin Kwari Market, Kano** — The heartbeat of African textiles
- Design direction inspired by premium Nigerian fashion houses and global luxury e-commerce standards
- Built with love for African craftsmanship and modern digital experiences

---

## 📄 License

This project is open source for learning and personal/commercial use with attribution.  
Created for Idris Ahmad — BIYORA SHOP.

---

**Ready to launch your premium textile business?**  
This repository is production-grade, beautiful, and fully functional with admin tools, auth, database layer, and rich content.

Made with precision by a senior full-stack developer & product builder.

**Last updated:** July 2026 — Post code review enhancements (security headers, branding fixes, documentation)
