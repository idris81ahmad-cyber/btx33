import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "How to Choose the Right Lace",
  description: "Swiss lace, cord lace, sequin lace — a buyer\u2019s guide from BIYORA SHOP, Kano.",
  path: "/journal/choosing-lace",
});

export default function ChoosingLacePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14 pb-24">
      <Link href="/journal" className="text-sm text-[#6B5F54] hover:text-[#6B2D3C]">← Back to Journal</Link>
      <div className="text-xs tracking-[3px] text-[#C5A46E] mt-6">BUYING GUIDE</div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-2">How to choose the right lace</h1>
      <div className="prose prose-stone max-w-none mt-8 text-[17px] leading-relaxed text-[#4A4038] space-y-4">
        <p>
          Lace is the crown jewel of many Nigerian celebrations. At Kantin Kwari, traders grade lace by weight, embroidery density, and origin. Here is what we look for when curating BIYORA collections.
        </p>

        <h2 className="font-semibold text-2xl mt-8">Swiss lace</h2>
        <p>Light, airy, and elegant. Best for bridal gowns, reception dresses, and formal gele. Look for clean scalloped edges and consistent thread tension.</p>

        <h2 className="font-semibold text-2xl mt-8">Cord lace</h2>
        <p>Heavier with raised cord embroidery. Ideal for structured blouses and mother-of-the-bride outfits. Holds shape beautifully for multi-day events.</p>

        <h2 className="font-semibold text-2xl mt-8">Sequin &amp; beaded lace</h2>
        <p>Maximum drama for owambe and red-carpet moments. Check that sequins are sewn — not glued — and that backing fabric is strong enough for tailoring.</p>

        <h2 className="font-semibold text-2xl mt-8">Our Kwari checklist</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li>Hold to light — quality lace has even mesh, no thin patches</li>
          <li>Smell test — chemical odours suggest poor storage</li>
          <li>Buy 10–15% extra for pattern matching on sleeves and bodice</li>
          <li>Match lining weight to lace — silk organza for Swiss, cotton sateen for cord</li>
        </ul>

        <p>
          Browse our <Link href="/shop?category=Premium+Lace" className="text-[#6B2D3C] underline">Premium Lace collection</Link> or use the{" "}
          <Link href="/calculator" className="text-[#6B2D3C] underline">fabric calculator</Link> to estimate yardage.
        </p>
      </div>
    </div>
  );
}