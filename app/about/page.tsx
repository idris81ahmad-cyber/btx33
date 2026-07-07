import Link from "next/link";
import { MapPin, Shield, Heart, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14 pb-24">
      <div className="max-w-3xl">
        <div className="uppercase tracking-[3px] text-xs text-[#C5A46E] mb-2">OUR HERITAGE</div>
        <h1 className="text-5xl md:text-6xl tracking-[-2.2px] font-semibold leading-[1.05]">
          From the legendary markets of Kano to your wardrobe.
        </h1>
        <p className="text-lg text-[#6B5F54] mt-6 leading-relaxed">
          <strong className="text-[#2C2522]">Direct from Kano verified sources.</strong> Every roll in our catalogue is sourced, inspected, and shipped through relationships built over decades in Kantin Kwari — not anonymous bulk resellers.
        </p>
      </div>

      <div className="mt-14 grid md:grid-cols-2 gap-8 items-start">
        <div className="prose prose-stone max-w-none text-[17px] leading-relaxed text-[#4A4038]">
          <p>
            BIYORA SHOP was born from a deep love for the unparalleled quality, colour, and craftsmanship found in Kantin Kwari — one of Africa&apos;s largest and most vibrant textile markets, in the ancient city of Kano, Nigeria.
          </p>
          <p>
            For generations, traders in Kwari have sourced and perfected the finest Ankara wax prints, intricate laces, luxurious brocades, authentic Adire, Shadda, Bazin, and premium cottons. We have taken this heritage and elevated it into a modern, trustworthy digital experience for customers across Nigeria and the world.
          </p>
          <p>
            The name <em>BIYORA</em> reflects beauty and pride — the feeling when you unfurl a perfect fabric for the first time, when your Asoebi squad matches flawlessly, when a bride walks in lace that catches every light in the hall.
          </p>
        </div>
        <div className="bg-[#2C2522] text-white rounded-3xl p-8">
          <MapPin className="w-6 h-6 text-[#C5A46E] mb-4" />
          <div className="font-semibold text-xl">Kantin Kwari Market</div>
          <p className="text-[#A89B8A] mt-2 text-sm leading-relaxed">
            Located in the heart of Kano, Kwari has been the beating pulse of West African textile trade for over a century. Merchants from across Nigeria, Niger, Chad, and beyond converge here — and BIYORA brings that same energy to your screen.
          </p>
          <div className="mt-6 pt-6 border-t border-white/10 text-sm text-[#C5A46E] tracking-widest">
            EST. TRADITION • 100+ YEARS OF KWARI
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-semibold tracking-tight mb-8">Our values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Authenticity", desc: "Hand-inspected fabrics. Verified suppliers. No substitutes." },
            { icon: Heart, title: "Fairness", desc: "Pricing that respects makers and customers — wholesale and retail." },
            { icon: Sparkles, title: "Celebration", desc: "Textiles for life's biggest moments — weddings, naming, graduations." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white p-8 rounded-3xl border border-[#D4C9B8]">
              <Icon className="w-6 h-6 text-[#C5A46E] mb-3" />
              <div className="font-semibold text-xl">{title}</div>
              <p className="text-[#6B5F54] mt-2 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 prose prose-stone max-w-3xl text-[17px] leading-relaxed text-[#4A4038]">
        <h3 className="font-semibold tracking-tight text-2xl text-[#2C2522]">Our promise</h3>
        <ul className="space-y-2">
          <li>Every fabric is hand-inspected for quality, colour accuracy, and authenticity.</li>
          <li>We work directly with trusted suppliers and master artisans in Kano and across Nigeria.</li>
          <li>Our curation focuses on premium pieces that tell a story — Asoebi, ceremonies, contemporary fashion.</li>
          <li>We believe in fair pricing that respects both the makers and our customers.</li>
        </ul>
        <p>
          BIYORA SHOP is more than an online store. It is a bridge — connecting the rich textile culture of Northern Nigeria with modern families, designers, and fashion lovers everywhere who value quality, beauty, and cultural pride.
        </p>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-[#D4C9B8]">
          <div className="text-[#C5A46E] text-sm tracking-widest mb-2">THE VISION</div>
          <div className="font-semibold text-2xl tracking-tight">Elevate African textiles globally</div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-[#D4C9B8]">
          <div className="text-[#C5A46E] text-sm tracking-widest mb-2">THE MISSION</div>
          <div className="font-semibold text-2xl tracking-tight">Curate the best. Deliver with excellence. Celebrate heritage.</div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-[#D4C9B8]">
          <div className="text-[#C5A46E] text-sm tracking-widest mb-2">THE PROMISE</div>
          <div className="font-semibold text-2xl tracking-tight">Quality you can feel. Service you can trust.</div>
        </div>
      </div>

      <div className="mt-16 flex flex-wrap justify-center gap-4">
        <Link href="/shop" className="btn-primary px-8 py-3.5 rounded-2xl font-medium">Shop fabrics</Link>
        <Link href="/journal" className="btn-gold px-8 py-3.5 rounded-2xl font-medium">Read the journal</Link>
        <Link href="/wholesale" className="px-8 py-3.5 rounded-2xl font-medium border border-[#D4C9B8] hover:bg-white transition">Wholesale</Link>
        <Link href="/contact" className="px-8 py-3.5 rounded-2xl font-medium border border-[#D4C9B8] hover:bg-white transition">Get in touch</Link>
      </div>
    </div>
  );
}