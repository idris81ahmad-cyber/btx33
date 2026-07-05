"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Where do your fabrics come from?",
    a: "All our textiles are sourced directly from trusted suppliers and artisans in Kantin Kwari Market, Kano, and other premium textile regions across Nigeria and West Africa. We personally vet every batch for quality and authenticity."
  },
  {
    q: "How do I know the colors will match my vision?",
    a: "We provide multiple high-resolution photos from different angles and lighting. Most of our customers are extremely happy with color accuracy. For very specific shade matching, feel free to contact us before ordering."
  },
  {
    q: "What lengths do you sell?",
    a: "Most fabrics are available in 5 yards and 6 yards. Some premium brocades and solids are also offered in 10-yard bundles. The available options are clearly shown on each product page."
  },
  {
    q: "Do you ship outside Nigeria?",
    a: "Yes! We currently ship to the UK, USA, Canada, Ghana, and several other countries. International shipping times vary between 7–18 business days depending on location. Contact us for a shipping quote."
  },
  {
    q: "What is your return policy?",
    a: "We offer a 7-day easy return policy from the date of delivery. Fabrics must be unused and in original condition. Please note that custom-cut lengths cannot be returned unless there is a defect."
  },
  {
    q: "How long does delivery take within Nigeria?",
    a: "Within Nigeria, most orders are delivered in 2–5 business days via reliable courier partners. Lagos and Abuja often receive next-day or 2-day delivery."
  },
  {
    q: "Can I order samples before buying full length?",
    a: "We are working on a sample program. For now, please reach out via WhatsApp and our team can sometimes arrange small swatches for key pieces (subject to availability)."
  },
  {
    q: "Do you offer wholesale or bulk pricing?",
    a: "Yes. Fashion designers, event planners, and retailers enjoy special pricing. Please contact us directly with your requirements for a custom quote."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="text-center mb-12">
        <div className="text-[#C5A46E] text-xs tracking-[3px]">EVERYTHING YOU NEED TO KNOW</div>
        <h1 className="text-6xl tracking-[-2px] font-semibold mt-2">Frequently Asked Questions</h1>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="border border-[#D4C9B8] rounded-3xl overflow-hidden bg-white">
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between px-7 py-5 text-left font-medium text-lg tracking-tight"
              >
                {faq.q}
                <ChevronDown className={`w-5 h-5 text-[#C5A46E] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-7 pb-7 text-[#4A4038] leading-relaxed text-[15px]">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12 text-sm text-[#6B5F54]">
        Still have questions? <a href="/contact" className="text-[#6B2D3C] underline">Contact our team</a> — we reply fast.
      </div>
    </div>
  );
}