import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="max-w-3xl">
        <div className="uppercase tracking-[3px] text-xs text-[#C5A46E] mb-2">OUR HERITAGE</div>
        <h1 className="text-6xl tracking-[-2.2px] font-semibold leading-none">From the legendary<br />markets of Kano to your wardrobe.</h1>
      </div>

      <div className="prose prose-stone max-w-3xl mt-10 text-[17px] leading-relaxed text-[#4A4038]">
        <p>BIYORA SHOP was born from a deep love for the unparalleled quality, color, and craftsmanship found in Kantin Kwari — one of Africa&apos;s largest and most vibrant textile markets, located in the ancient city of Kano, Nigeria.</p>
        
        <p>For generations, traders in Kwari have sourced and perfected the finest Ankara wax prints, intricate laces from Europe and Asia, luxurious brocades, authentic Adire, and premium cottons. We have taken this heritage and elevated it into a modern, trustworthy digital experience for customers across Nigeria and the world.</p>

        <h3 className="font-semibold tracking-tight mt-10 mb-3 text-2xl">Our Promise</h3>
        <ul className="space-y-2">
          <li>Every fabric is hand-inspected for quality, color accuracy, and authenticity.</li>
          <li>We work directly with trusted suppliers and master artisans in Kano and across Nigeria.</li>
          <li>Our curation focuses on premium pieces that tell a story — whether for Asoebi, traditional ceremonies, or contemporary fashion.</li>
          <li>We believe in fair pricing that respects both the makers and our customers.</li>
        </ul>

        <p className="mt-8">BIYORA SHOP is more than an online store. It is a bridge — connecting the rich textile culture of Northern Nigeria with modern families, designers, and fashion lovers everywhere who value quality, beauty, and cultural pride.</p>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-[#D4C9B8]">
          <div className="text-[#C5A46E] text-sm tracking-widest mb-2">THE VISION</div>
          <div className="font-semibold text-2xl tracking-tight">Elevate African Textiles Globally</div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-[#D4C9B8]">
          <div className="text-[#C5A46E] text-sm tracking-widest mb-2">THE MISSION</div>
          <div className="font-semibold text-2xl tracking-tight">Curate only the best. Deliver with excellence. Celebrate our heritage.</div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-[#D4C9B8]">
          <div className="text-[#C5A46E] text-sm tracking-widest mb-2">THE PROMISE</div>
          <div className="font-semibold text-2xl tracking-tight">Quality you can feel. Service you can trust.</div>
        </div>
      </div>

      <div className="text-center mt-16">
        <Link href="/contact" className="btn-gold inline-flex px-8 py-3.5 rounded-2xl font-medium">Get in Touch</Link>
      </div>
    </div>
  );
}