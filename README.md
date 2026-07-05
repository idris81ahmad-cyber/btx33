# ðŸ§µ BIYORA SHOP â€” Premium African Textiles

> **Kwari Market Quality, Delivered.**  
> A modern, luxurious e-commerce experience showcasing the finest textiles from Kanoâ€™s iconic Kantin Kwari Market and premium African textile heritage.

![BIYORA SHOP Preview](public/images/ankara-premium.jpg)

**Live Demo:** [biyora-shop.vercel.app](https://biyora-shop.vercel.app)

---

## âœ¨ Features

### Core Experience
- **Stunning Home Page** â€” Hero with powerful cultural positioning, featured fabrics, category highlights, trust signals, and newsletter signup
- **Fully Functional Shop** â€” Real-time search, advanced filters (category, color family, pattern style, price range), sorting, beautiful responsive product grid
- **Premium Product Detail Pages** â€” High-quality image gallery, dynamic length selector with live price update, detailed specifications, â€œHow to Styleâ€ suggestions, related products
- **Cart System** â€” Persistent cart with Zustand + localStorage, quantity & length management, live totals in â‚¦
- **Elegant Checkout** â€” Nigerian states dropdown, comprehensive address form, multiple realistic payment options, form validation with Zod + React Hook Form
- **Beautiful Order Success** â€” Confetti celebration, order number, â€œTrack Orderâ€ demo

### Additional Pages
- **About** â€” Rich brand story connecting to Kwari Market heritage
- **Contact** â€” Fully working contact form
- **FAQ** â€” Helpful accordion with common customer questions

### Technical Excellence
- Next.js 15 (App Router) + TypeScript (strict) **â†’ Upgraded to 15.4.2 (security patch)**
- Tailwind CSS 4 + beautiful custom premium design system (burgundy, gold, cream, forest tones)
- Framer Motion for smooth animations
- Zustand with persist middleware for cart
- Sonner for elegant toast notifications
- React Hook Form + Zod for all forms
- Fully responsive + mobile-first with premium hamburger menu
- Loading states, empty states, and delightful micro-interactions
- Accessible and production-ready

---

## ðŸ›  Tech Stack

| Category          | Technology                          |
|-------------------|-------------------------------------|
| Framework         | Next.js 15 (App Router)            |
| Language          | TypeScript (strict mode)           |
| Styling           | Tailwind CSS 4                     |
| Animations        | Framer Motion                      |
| State Management  | Zustand + persist                  |
| Forms & Validation| React Hook Form + Zod              |
| Notifications     | Sonner                             |
| Icons             | Lucide React                       |
| Deployment        | Vercel (recommended)               |

---

## ðŸš€ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/idris81ahmad-cyber/biyora-shop.git
cd biyora-shop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm start
```

---

## ðŸ“ Project Structure

```
biyora-shop/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ layout.tsx                 # Root layout + Navbar + Toaster
â”‚   â”œâ”€â”€ page.tsx                   # Beautiful homepage
â”‚   â”œâ”€â”€ globals.css                # Premium design system + Tailwind
â”‚   â”œâ”€â”€ shop/
â”‚   â”‚   â””â”€â”€ page.tsx               # Full shop with filters & search
â”‚   â”œâ”€â”€ products/
â”‚   â”‚   â””â”€â”€ [slug]/
â”‚       â””â”€â”€ page.tsx           # Dynamic product detail page
â”‚   â”œâ”€â”€ cart/
â”‚   â”‚   â””â”€â”€ page.tsx               # Dedicated cart experience
â”‚   â”œâ”€â”€ checkout/
â”‚   â”‚   â””â”€â”€ page.tsx               # Complete checkout flow
â”‚   â”œâ”€â”€ success/
â”‚   â”‚   â””â”€â”€ page.tsx               # Order confirmation + confetti
â”‚   â”œâ”€â”€ about/
â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”œâ”€â”€ contact/
â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â””â”€â”€ faq/
â”‚       â””â”€â”€ page.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ Navbar.tsx
â”‚   â”œâ”€â”€ Footer.tsx
â”‚   â””â”€â”€ ProductCard.tsx
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ products.ts                # All 12 premium textile products
â”‚   â”œâ”€â”€ cart-store.ts              # Zustand cart with persist
â”‚   â””â”€â”€ utils.ts
â”œâ”€â”€ types/
â”‚   â””â”€â”€ product.ts
â”œâ”€â”€ .github/
â”‚   â”œâ”€â”€ workflows/
â”‚   â”‚   â””â”€â”€ ci.yml                 # Lint + Typecheck + Build
â”‚   â””â”€â”€ PULL_REQUEST_TEMPLATE.md
â”œâ”€â”€ package.json
â”œâ”€â”€ next.config.ts
â”œâ”€â”€ tsconfig.json
â”œâ”€â”€ components.json                # shadcn/ui ready
â”œâ”€â”€ README.md
â””â”€â”€ .env.example
```

---

## ðŸ§µ The 12 Premium Textile Products

| #  | Name                                      | Category                    | Price (â‚¦)   | Length Options       |
|----|-------------------------------------------|-----------------------------|-------------|----------------------|
| 1  | Royal Gold Ankara Wax Print               | Ankara Prints               | 18,500     | 5yd, 6yd            |
| 2  | Swiss Voile Cord Lace â€“ Ivory             | Premium Lace                | 48,000     | 5yd, 6yd            |
| 3  | Premium Guinea Brocade â€“ Burgundy         | Brocade & Damask            | 35,000     | 5yd, 6yd, 10yd      |
| 4  | Indigo Adire Tie-Dye Fabric               | Adire & Tie-Dye             | 16,500     | 5yd, 6yd            |
| 5  | French Guipure Lace â€“ Champagne Gold      | Premium Lace                | 55,000     | 5yd                 |
| 6  | Emerald Silk Chiffon â€“ Luxe Drape         | Silk, Chiffon & Voile       | 29,500     | 5yd, 6yd            |
| 7  | Premium Solid Cotton Poplin â€“ Warm Cream  | Plain & Solid Premium Cottons | 12,800   | 5yd, 6yd, 10yd      |
| 8  | Royal Blue Floral Ankara Wax Print        | Ankara Prints               | 19,200     | 5yd, 6yd            |
| 9  | Gold Thread Swiss Lace â€“ White            | Premium Lace                | 42,500     | 5yd, 6yd            |
| 10 | Deep Green Damask Shadda                  | Brocade & Damask            | 38,000     | 5yd, 6yd, 10yd      |
| 11 | Sunset Orange Handcrafted Adire           | Adire & Tie-Dye             | 24,000     | 5yd, 6yd            |
| 12 | Soft Blush Pink Premium Voile             | Silk, Chiffon & Voile       | 15,200     | 5yd, 6yd, 10yd      |

All products include rich descriptions, realistic specs, multiple image URLs, ratings, and stock levels.

---

## ðŸ›  How to Add New Fabrics (Easy!)

1. Open `lib/products.ts`
2. Add a new object to the `products` array following the existing `Product` interface
3. Add image paths (`/images/your-fabric.jpg` in `public/images/`) or external URLs (configure hosts in `next.config.ts`)
4. Thatâ€™s it â€” the shop, product pages, and filters will automatically include it!

---

## ðŸ“¦ Deployment (Vercel â€” Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) â†’ New Project â†’ Import `biyora-shop` repo
3. Vercel will auto-detect Next.js. Click **Deploy**
4. Your site will be live in under 2 minutes with automatic HTTPS + edge caching

**Custom Domain:** Add your domain in Vercel settings (recommended: `biyorashop.com` or similar)

---

## âœ… CI / Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs these checks on every push and PR.

---

## ðŸš© Future Roadmap (Phase 2 Ideas)

- User accounts & order history
- Real payment integration (Paystack)
- Wholesale / bulk order flow
- Admin dashboard for inventory
- Digital swatch samples
- Reviews & ratings system (real)
- Multi-currency support

The current architecture is clean and scalable for these additions.

---

## ðŸ“¸ Screenshots / Placeholders

*(Add your screenshots here after deployment)*

- Home hero
- Shop grid with filters
- Product detail page
- Cart & Checkout flow

---

## ðŸ™ Credits & Inspiration

- **Kantin Kwari Market, Kano** â€” The heartbeat of African textiles
- Design direction inspired by premium Nigerian fashion houses and global luxury e-commerce standards
- Built with love for African craftsmanship and modern digital experiences

---

## ðŸ“„ License

This project is open source for learning and personal/commercial use with attribution.  
Created for Idris Ahmad â€” BIYORA SHOP.

---

**Ready to launch your premium textile business?**  
This repository is production-grade, beautiful, and fully functional.

Made with precision by a senior full-stack developer & product designer.

**Last upgraded:** Next.js 15.4.2 (security patch) - June 30, 2026
