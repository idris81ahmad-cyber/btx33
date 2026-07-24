import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Eye, Handshake, Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Sourcing · Kantin Kwari",
  description:
    "How BIYORA SHOP sources premium African textiles from Kantin Kwari Market in Kano — authenticity, inspection, and fair relationships.",
};

export default function SourcingPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14 pb-24">
      <div className="max-w-3xl">
        <p className="uppercase tracking-[3px] text-xs text-[#C5A46E] mb-2">
          AUTHENTICITY
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-[-2px] font-semibold leading-[1.05]">
          About the market &amp; our sourcing
        </h1>
        <p className="text-lg text-[#6B5F54] mt-6 leading-relaxed">
          BIYORA is not a faceless bulk importer. We buy the way serious customers
          buy in Kano — with eyes on the cloth, hands on the weave, and names we
          trust in Kantin Kwari.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-8">
        <div className="bg-[#2C2522] text-white rounded-3xl p-8">
          <MapPin className="w-6 h-6 text-[#C5A46E] mb-4" />
          <h2 className="text-2xl font-semibold tracking-tight">Kantin Kwari</h2>
          <p className="text-[#A89B8A] mt-3 text-sm leading-relaxed">
            One of West Africa&apos;s great textile markets sits in the heart of
            Kano. For generations, merchants have moved Ankara, lace, brocade,
            Adire, Shadda, and more through these alleys — BIYORA bridges that
            market to your screen with modern trust standards.
          </p>
        </div>
        <div className="space-y-4 text-[16px] leading-relaxed text-[#4A4038]">
          <p>
            When you open a parcel from us, you should feel the same confidence as
            walking a trusted stall: colour that matches the listing, length that
            was measured, and fabric that sews the way your tailor expects.
          </p>
          <p>
            We curate for celebrations and everyday pride — asoebi squads, bridal
            lace, agbada brocade, and the quiet cottons that make a wardrobe work.
          </p>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: Handshake,
            title: "Relationships first",
            desc: "We work with known suppliers and revisit quality batch by batch — not one-off mystery containers.",
          },
          {
            icon: Eye,
            title: "Inspected before shipping",
            desc: "Colour, defects, and finish are checked before we pack. What you order is what we send.",
          },
          {
            icon: Sparkles,
            title: "Story in every roll",
            desc: "Each listing carries origin notes, care, and best uses so you and your tailor decide with clarity.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-white border border-[#D4C9B8] rounded-3xl p-7"
          >
            <Icon className="w-6 h-6 text-[#C5A46E] mb-3" />
            <h3 className="font-semibold text-xl tracking-tight">{title}</h3>
            <p className="text-sm text-[#6B5F54] mt-2 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-[#D4C9B8] bg-white p-8 sm:p-10">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          Our promise to Nigerian &amp; diaspora customers
        </h2>
        <ul className="space-y-3 text-[#4A4038] text-[15px] leading-relaxed">
          <li>• Clear photos and specs (width, weight, opacity) for lace &amp; chiffon.</li>
          <li>• 7-day returns on unused fabric — see FAQ for details.</li>
          <li>• Secure Paystack checkout; order history when you create an account.</li>
          <li>• WhatsApp support when you need a quick human answer.</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm min-h-[48px]"
          >
            Shop the collection <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center px-6 py-3 rounded-2xl border border-[#D4C9B8] text-sm font-medium min-h-[48px]"
          >
            About BIYORA
          </Link>
        </div>
      </div>
    </div>
  );
}
