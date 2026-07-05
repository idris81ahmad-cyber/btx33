import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#2C2522] text-[#EDE4D4] pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-y-12">
        {/* Brand */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#C5A46E] flex items-center justify-center">
              <span className="text-[#2C2522] font-bold text-xl tracking-[-1px]">B</span>
            </div>
            <span className="font-semibold text-xl tracking-[-0.8px] text-white">BIYORA SHOP</span>
          </div>
          <p className="max-w-sm text-[#A89B8A] text-[15px] leading-relaxed">
            Bringing the legendary quality and vibrant heritage of Kantin Kwari Market in Kano 
            to discerning customers around the world. Premium textiles, elevated.
          </p>
          <div className="mt-6 text-xs tracking-[2px] text-[#C5A46E]">EST. 2024 • KANO, NIGERIA</div>
        </div>

        {/* Links */}
        <div className="md:col-span-2">
          <div className="font-semibold text-white mb-4 tracking-wider text-sm">EXPLORE</div>
          <div className="space-y-2.5 text-sm">
            <Link href="/shop" className="block hover:text-[#C5A46E] transition">All Fabrics</Link>
            <Link href="/shop?category=Ankara+Prints" className="block hover:text-[#C5A46E] transition">Ankara Prints</Link>
            <Link href="/shop?category=Premium+Lace" className="block hover:text-[#C5A46E] transition">Premium Lace</Link>
            <Link href="/shop?category=Brocade+%26+Damask" className="block hover:text-[#C5A46E] transition">Brocade &amp; Damask</Link>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="font-semibold text-white mb-4 tracking-wider text-sm">COMPANY</div>
          <div className="space-y-2.5 text-sm">
            <Link href="/about" className="block hover:text-[#C5A46E] transition">Our Story</Link>
            <Link href="/contact" className="block hover:text-[#C5A46E] transition">Contact Us</Link>
            <Link href="/faq" className="block hover:text-[#C5A46E] transition">FAQ</Link>
            <a href="#careers" className="block hover:text-[#C5A46E] transition">Careers (Coming Soon)</a>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="font-semibold text-white mb-4 tracking-wider text-sm">OUR PROMISE</div>
          <div className="text-sm space-y-1.5 text-[#A89B8A]">
            <div>✓ Authentic premium quality from trusted Kano sources</div>
            <div>✓ Carefully inspected before shipping</div>
            <div>✓ Fast &amp; reliable nationwide + international delivery</div>
            <div>✓ 7-day easy returns on all fabrics</div>
          </div>
          <div className="mt-8 flex gap-5 text-[#C5A46E] text-sm">
            <a href="#" className="hover:text-white transition">Instagram</a>
            <a href="#" className="hover:text-white transition">WhatsApp</a>
          </div>
          <div className="mt-4 text-[10px] tracking-widest text-[#6B5F54]">
            SECURE CHECKOUT • MULTIPLE PAYMENT OPTIONS
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-white/10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6B5F54]">
        <div>© {new Date().getFullYear()} BIYORA SHOP. All rights reserved. Kano, Nigeria.</div>
        <div className="flex gap-6">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Shipping Policy</span>
        </div>
      </div>
    </footer>
  );
}