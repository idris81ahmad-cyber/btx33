import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "FAQ",
  description: "Frequently asked questions about ordering premium African textiles, shipping, returns, and fabric care.",
  path: "/faq",
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}