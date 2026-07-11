import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Meet the Artisans",
  description: "Stories from Kantin Kwari traders and inspectors behind BIYORA SHOP.",
  path: "/journal/meet-artisans",
});

const artisans = [
  { name: "Alhaji Musa", role: "Master trader, 30 years in Kwari", quote: "We don\u2019t sell cloth — we sell trust. Every buyer who returns is family." },
  { name: "Hauwa I.", role: "Quality inspector", quote: "I check every roll under natural light. If the colour is off by even one shade, it doesn\u2019t leave our stall." },
  { name: "Yusuf B.", role: "Lace specialist", quote: "Swiss lace has a sound — crisp, like paper. You learn to hear quality." },
  { name: "Amina K.", role: "Adire dyer, Kofar Mata", quote: "Indigo is patience. The fabric tells you when it\u2019s ready." },
];

export default function MeetArtisansPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-14 pb-24">
      <Link href="/journal" className="text-sm text-[#6B5F54] hover:text-[#6B2D3C]">← Back to Journal</Link>
      <div className="text-xs tracking-[3px] text-[#C5A46E] mt-6">HERITAGE</div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-2">Meet the artisans of Kantin Kwari</h1>
      <p className="text-[#6B5F54] mt-4 text-lg max-w-2xl">
        BIYORA SHOP is built on relationships — with traders who have spent decades perfecting their eye, and craftspeople who keep Nigeria&apos;s textile traditions alive.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        {artisans.map((a) => (
          <div key={a.name} className="bg-white border border-[#D4C9B8] rounded-3xl p-8">
            <div className="w-12 h-12 rounded-full bg-[#6B2D3C] text-[#C5A46E] flex items-center justify-center font-semibold text-lg mb-4">
              {a.name.charAt(0)}
            </div>
            <div className="font-semibold text-xl">{a.name}</div>
            <div className="text-sm text-[#C5A46E] tracking-wide mt-1">{a.role}</div>
            <p className="text-[#6B5F54] mt-4 italic leading-relaxed">&ldquo;{a.quote}&rdquo;</p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-[#F8F4EC] border border-[#D4C9B8] rounded-3xl p-8 text-center">
        <div className="font-semibold text-xl">Direct from Kano verified sources</div>
        <p className="text-[#6B5F54] mt-2 max-w-lg mx-auto">
          Every BIYORA fabric passes through hands that have handled textiles for generations. That is the difference you feel — and the story you wear.
        </p>
        <Link href="/about" className="btn-primary inline-flex mt-6 px-8 py-3 rounded-2xl">Read our full story</Link>
      </div>
    </div>
  );
}