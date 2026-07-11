import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Fabric Yardage Calculator",
  description:
    "Estimate how many yards you need for agbada, wrapper, blouse, kaftan, and other garments. Free fabric calculator from BIYORA SHOP.",
  path: "/calculator",
});

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
