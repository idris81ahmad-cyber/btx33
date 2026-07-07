import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Styling Tips for Every Occasion",
  description: "Owambe, corporate, and casual styling with African textiles from BIYORA SHOP.",
  path: "/journal/styling-tips",
});

export default function StylingTipsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14 pb-24">
      <Link href="/journal" className="text-sm text-[#6B5F54] hover:text-[#6B2D3C]">← Back to Journal</Link>
      <div className="text-xs tracking-[3px] text-[#C5A46E] mt-6">STYLE</div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-2">Styling fabrics for every occasion</h1>
      <div className="mt-8 space-y-8 text-[17px] leading-relaxed text-[#4A4038]">
        <section>
          <h2 className="font-semibold text-2xl mb-2">Owambe &amp; Asoebi</h2>
          <p>Lead with bold Ankara or sequin lace. Coordinate gele and footwear to one accent colour from the print. For large groups, order from the same dye lot — we batch wholesale orders for exactly this reason.</p>
        </section>
        <section>
          <h2 className="font-semibold text-2xl mb-2">Traditional ceremonies</h2>
          <p>Shadda and brocade signal respect and status. Men&apos;s agbada in deep wine or royal blue; women in complementary lace wrappers. Add coral or gold accessories — let the fabric speak first.</p>
        </section>
        <section>
          <h2 className="font-semibold text-2xl mb-2">Corporate &amp; smart casual</h2>
          <p>Tone-on-tone Ankara pencil skirts, senator shirts in plain cotton, or a silk chiffon blouse under a blazer. Keep prints subtle — small geometric repeats read as texture from a distance.</p>
        </section>
        <section>
          <h2 className="font-semibold text-2xl mb-2">Weekend &amp; travel</h2>
          <p>Light Adire tunics, Bazin shorts sets, or a flowing kaftan in breathable voile. Pack fabrics that resist creasing — our cotton blends are chosen for this.</p>
        </section>
        <p>
          <Link href="/shop" className="text-[#6B2D3C] underline font-medium">Explore the shop →</Link>
        </p>
      </div>
    </div>
  );
}