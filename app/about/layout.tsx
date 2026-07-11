import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Our Story — Kwari Market Heritage",
  description: "Learn how BIYORA SHOP brings the legendary quality of Kano\u2019s Kantin Kwari Market to customers worldwide.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}