import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Shop Premium African Fabrics | BIYORA SHOP",
  description: "Browse curated Ankara, Lace, Brocade, Adire, Shadda, Bazin and more from Kantin Kwari Market. Filter by category, color, and pattern.",
  path: "/shop",
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}