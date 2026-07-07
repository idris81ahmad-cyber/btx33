import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Fabric Journal",
  description: "Fabric care guides, styling tips, and stories from Kantin Kwari artisans at BIYORA SHOP.",
  path: "/journal",
});

const articles = [
  {
    slug: "fabric-care",
    tag: "Care Guide",
    title: "How to care for Ankara, lace & brocade",
    excerpt: "Washing, ironing, and storage tips to keep your Kwari fabrics vibrant for years.",
  },
  {
    slug: "choosing-lace",
    tag: "Buying Guide",
    title: "How to choose the right lace",
    excerpt: "Swiss vs cord vs sequin lace — what to look for before you buy.",
  },
  {
    slug: "styling-tips",
    tag: "Style",
    title: "Styling fabrics for every occasion",
    excerpt: "From owambe to office — pairings that honour tradition and feel modern.",
  },
  {
    slug: "meet-artisans",
    tag: "Heritage",
    title: "Meet the artisans of Kantin Kwari",
    excerpt: "The traders, dyers, and inspectors behind every BIYORA shipment.",
  },
];

export default function JournalPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="mb-12">
        <div className="text-xs tracking-[3px] text-[#C5A46E]">BIYORA JOURNAL</div>
        <h1 className="text-5xl font-semibold tracking-tight mt-2">Fabric education &amp; culture</h1>
        <p className="text-[#6B5F54] mt-3 max-w-2xl">
          Learn from the same expertise that powers our curation — practical guides rooted in Kano&apos;s textile traditions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/journal/${a.slug}`}
            className="group bg-white border border-[#D4C9B8] rounded-3xl p-8 hover:border-[#6B2D3C] transition"
          >
            <div className="text-xs tracking-widest text-[#C5A46E]">{a.tag}</div>
            <h2 className="text-2xl font-semibold tracking-tight mt-2 group-hover:text-[#6B2D3C] transition">
              {a.title}
            </h2>
            <p className="text-[#6B5F54] mt-3 text-sm leading-relaxed">{a.excerpt}</p>
            <span className="inline-block mt-4 text-sm font-medium text-[#6B2D3C]">Read article →</span>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/calculator" className="btn-gold inline-flex px-8 py-3.5 rounded-2xl font-medium">
          Try the fabric calculator
        </Link>
      </div>
    </div>
  );
}