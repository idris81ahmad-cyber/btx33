import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Our Story | BIYORA SHOP — Kwari Market Heritage",
  description: "Learn how BIYORA SHOP brings the legendary quality of Kano's Kantin Kwari Market to customers worldwide.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}