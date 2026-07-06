import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Contact Us | BIYORA SHOP",
  description: "Get in touch with BIYORA SHOP for fabric inquiries, bulk orders, and custom sourcing from Kantin Kwari Market.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}