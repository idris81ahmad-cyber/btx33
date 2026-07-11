import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Wholesale & Bulk Orders",
  description:
    "Wholesale African textiles for tailors, boutiques, and bulk buyers. Source Ankara, lace, brocade, and more from Kantin Kwari Market.",
  path: "/wholesale",
});

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
