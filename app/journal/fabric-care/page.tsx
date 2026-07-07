import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Fabric Care Guide",
  description: "How to wash, iron, and store Ankara, lace, brocade, and Adire from BIYORA SHOP.",
  path: "/journal/fabric-care",
});

export default function FabricCarePage() {
  return (
    <ArticleLayout title="How to care for Ankara, lace & brocade" tag="Care Guide">
      <p>
        Premium fabrics from Kantin Kwari deserve premium care. Follow these guidelines to preserve colour, hand-feel, and structure — whether your piece is fresh from our Kano warehouse or a treasured heirloom.
      </p>

      <h2>Ankara &amp; wax prints</h2>
      <ul>
        <li>Wash inside-out in cold water with mild detergent. Hot water fades wax-resist colours.</li>
        <li>Air-dry in shade. Direct sun can bleach vibrant oranges and magentas.</li>
        <li>Iron on the reverse side while slightly damp for a crisp finish without shine.</li>
      </ul>

      <h2>Premium lace</h2>
      <ul>
        <li>Hand-wash or use a delicate cycle in a mesh bag. Never wring — press water out gently.</li>
        <li>Lay flat to dry. Hanging can stretch embroidered sections.</li>
        <li>Store rolled rather than folded to prevent permanent crease lines on sequins or cord work.</li>
      </ul>

      <h2>Brocade, damask &amp; Shadda</h2>
      <ul>
        <li>Dry-clean for heavily structured agbada. For home care, steam rather than direct iron contact.</li>
        <li>Brush lightly with a soft cloth before storage to remove dust from raised patterns.</li>
      </ul>

      <h2>Adire &amp; tie-dye</h2>
      <ul>
        <li>Soak in cold water with a tablespoon of salt before first wash to set natural dyes.</li>
        <li>Wash separately for the first 2–3 cycles — indigo can bleed slightly.</li>
      </ul>

      <p>
        Questions about a specific BIYORA fabric? <Link href="/contact" className="text-[#6B2D3C] underline">Contact our team</Link> — we inspect every roll before it ships.
      </p>
    </ArticleLayout>
  );
}

function ArticleLayout({ title, tag, children }: { title: string; tag: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14 pb-24">
      <Link href="/journal" className="text-sm text-[#6B5F54] hover:text-[#6B2D3C]">← Back to Journal</Link>
      <div className="text-xs tracking-[3px] text-[#C5A46E] mt-6">{tag.toUpperCase()}</div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-2">{title}</h1>
      <div className="prose prose-stone max-w-none mt-8 text-[17px] leading-relaxed text-[#4A4038] space-y-4">
        {children}
      </div>
    </div>
  );
}