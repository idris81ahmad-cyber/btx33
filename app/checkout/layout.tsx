import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Checkout",
  description: "Secure checkout for premium African textiles. Pay with card, bank transfer, or USSD via Paystack.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
