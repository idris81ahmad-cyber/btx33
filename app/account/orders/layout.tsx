import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "My Orders",
  description:
    "Track BIYORA SHOP order history, payment status, packing, and delivery progress.",
  path: "/account/orders",
  noIndex: true,
});

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
