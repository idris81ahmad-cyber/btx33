export const siteConfig = {
  name: "BIYORA SHOP",
  tagline: "Premium African Textiles",
  description:
    "Discover curated premium African textiles and fabrics from the heart of Kano's Kantin Kwari Market. Luxury Ankara, Lace, Brocade, Adire, Shadda, Bazin & more.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://biyora-shop.vercel.app",
  ogImage: "/images/ankara-premium.jpg",
  locale: "en_NG",
  email: "hello@biyorashop.com",
  location: "Kano, Nigeria",
} as const;

export function absoluteUrl(path = ""): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
}