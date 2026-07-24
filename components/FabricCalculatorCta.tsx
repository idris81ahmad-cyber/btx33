import Link from "next/link";
import { Ruler, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type FabricCalculatorCtaProps = {
  /** Pre-select fabric context in calculator via query */
  productName?: string;
  category?: string;
  variant?: "card" | "banner" | "compact";
  className?: string;
};

export default function FabricCalculatorCta({
  productName,
  category,
  variant = "card",
  className,
}: FabricCalculatorCtaProps) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (productName) params.set("fabric", productName);
  const href = `/calculator${params.toString() ? `?${params.toString()}` : ""}`;

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-[#6B2D3C] underline-offset-4 hover:underline min-h-[44px]",
          className,
        )}
      >
        <Ruler className="w-4 h-4" aria-hidden="true" />
        How much fabric do I need?
      </Link>
    );
  }

  if (variant === "banner") {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center justify-between gap-4 rounded-2xl border border-[#E8DFD0] bg-gradient-to-r from-[#FBF8F3] to-white px-5 py-4 hover:border-[#C5A46E]/60 transition group",
          className,
        )}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#6B2D3C]/10 flex items-center justify-center shrink-0">
            <Ruler className="w-5 h-5 text-[#6B2D3C]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#2C2522] text-sm">How much do I need?</p>
            <p className="text-xs text-[#6B5F54] mt-0.5 leading-relaxed">
              Free yardage guide for agbada, asoebi, bridal, gele & more
              {productName ? ` — including looks with ${productName}` : ""}.
            </p>
          </div>
        </div>
        <ArrowRight
          className="w-4 h-4 text-[#C5A46E] shrink-0 group-hover:translate-x-0.5 transition"
          aria-hidden="true"
        />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-[#D4C9B8] bg-white p-6 sm:p-7 shadow-sm",
        className,
      )}
    >
      <div className="text-[11px] tracking-[0.2em] text-[#C5A46E] font-medium mb-2">
        YARDAGE GUIDE
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-[#2C2522] mb-2">
        How much fabric do I need?
      </h3>
      <p className="text-sm text-[#6B5F54] leading-relaxed mb-5">
        Use our fabric calculator for agbada, asoebi, bridal lace, gele, senator shirts, and more —
        so you order with confidence before you sew.
      </p>
      <Link
        href={href}
        className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium min-h-[48px]"
      >
        <Ruler className="w-4 h-4" aria-hidden="true" />
        Open fabric calculator
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
