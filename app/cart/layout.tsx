import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Your Cart",
  description: "Review your selected African fabrics before checkout at BIYORA SHOP.",
  path: "/cart",
  noIndex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
