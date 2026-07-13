import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "My Account",
  description:
    "Manage your BIYORA SHOP account, delivery addresses, and track order status.",
  path: "/account",
  noIndex: true,
});

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
