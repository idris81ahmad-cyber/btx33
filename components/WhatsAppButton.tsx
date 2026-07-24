"use client";

import { MessageCircle } from "lucide-react";

const DEFAULT_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2349061811134";
const DEFAULT_TEXT =
  process.env.NEXT_PUBLIC_WHATSAPP_PREFILL ||
  "Hello BIYORA SHOP — I have a question about fabrics / my order.";

export default function WhatsAppButton() {
  const href = `https://wa.me/${DEFAULT_PHONE.replace(/\D/g, "")}?text=${encodeURIComponent(DEFAULT_TEXT)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white pl-3.5 pr-4 py-3 shadow-lg shadow-emerald-900/20 hover:bg-[#1ebe57] transition min-h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46E]"
      aria-label="Chat with BIYORA on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" aria-hidden="true" />
      <span className="text-sm font-semibold hidden sm:inline">WhatsApp</span>
    </a>
  );
}
