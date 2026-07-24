import Link from "next/link";
import {
  Award,
  ShieldCheck,
  RefreshCw,
  MapPin,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIGNALS = [
  {
    icon: MapPin,
    title: "Sourced from Kantin Kwari",
    desc: "Hand-picked from Kano’s legendary textile market — not anonymous bulk imports.",
  },
  {
    icon: ShieldCheck,
    title: "Inspected before shipping",
    desc: "Every piece checked for colour, hand-feel, and authenticity before it leaves us.",
  },
  {
    icon: RefreshCw,
    title: "7-day easy returns",
    desc: "Changed your mind? Return unused fabric within 7 days — no drama.",
  },
  {
    icon: Lock,
    title: "Secure Paystack checkout",
    desc: "Card & transfer protected by Paystack. We never store your card details.",
  },
] as const;

export function TrustBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-y border-[#D4C9B8] bg-white/70 py-4",
        className,
      )}
    >
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs sm:text-sm text-[#6B5F54]">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
          Sourced from Kantin Kwari
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
          Inspected before shipping
        </span>
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
          7-day easy returns
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
          Paystack secure payment
        </span>
      </div>
    </div>
  );
}

export function TrustGrid({ className }: { className?: string }) {
  return (
    <section className={cn("max-w-6xl mx-auto px-6 py-16 sm:py-20", className)}>
      <div className="text-center mb-10">
        <p className="text-[11px] tracking-[0.28em] text-[#C5A46E] font-medium mb-2">
          WHY BIYORA
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Trust built the Kwari way
        </h2>
        <p className="text-sm text-[#6B5F54] mt-2 max-w-lg mx-auto">
          In Nigerian fashion, authenticity matters. Here is how we protect yours.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SIGNALS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-white border border-[#D4C9B8] rounded-3xl p-6 text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F8F4EC] flex items-center justify-center mb-4">
              <Icon className="w-6 h-6 text-[#6B2D3C]" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-base tracking-tight mb-2">{title}</h3>
            <p className="text-sm text-[#6B5F54] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <p className="text-center mt-8 text-sm">
        <Link
          href="/sourcing"
          className="text-[#6B2D3C] font-medium underline underline-offset-4"
        >
          Read our sourcing story
        </Link>
        {" · "}
        <Link href="/faq" className="text-[#6B5F54] underline underline-offset-4">
          Returns & FAQ
        </Link>
      </p>
    </section>
  );
}

export function ProductTrustStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E8DFD0] bg-[#FBF8F3] px-4 py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#6B5F54]",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <Award className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
        Sourced from Kantin Kwari, Kano
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
        Inspected before shipping
      </span>
      <span className="inline-flex items-center gap-1.5">
        <RefreshCw className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
        7-day easy returns
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
        Secure Paystack payment
      </span>
    </div>
  );
}

export function PaymentBadges({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 text-[10px] text-[#6B5F54]",
        className,
      )}
      aria-label="Accepted payment methods"
    >
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8DFD0] bg-white font-semibold">
        <Lock className="w-3 h-3" aria-hidden="true" /> Paystack
      </span>
      <span className="px-2.5 py-1 rounded-lg border border-[#E8DFD0] bg-white">Cards</span>
      <span className="px-2.5 py-1 rounded-lg border border-[#E8DFD0] bg-white">Transfer</span>
      <span className="px-2.5 py-1 rounded-lg border border-[#E8DFD0] bg-white">USSD</span>
    </div>
  );
}
