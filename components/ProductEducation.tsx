import Link from "next/link";
import { BookOpen, Droplets, MapPin, Sparkles } from "lucide-react";
import type { Product } from "@/types/product";
import {
  formatOccasion,
  HIGHLIGHT_SPEC_KEYS,
  hydrateProduct,
} from "@/lib/product-education";
import FabricCalculatorCta from "@/components/FabricCalculatorCta";

export default function ProductEducation({ product }: { product: Product }) {
  const p = hydrateProduct(product);
  const highlight = HIGHLIGHT_SPEC_KEYS.map((key) => ({
    key,
    value: p.specifications?.[key] || (key === "Width" ? p.width : key === "Weight" ? p.weight : key === "Opacity" ? p.opacity : undefined),
  })).filter((row) => row.value);

  return (
    <div className="space-y-10 mb-12">
      {/* Occasion chips */}
      {p.bestUses && p.bestUses.length > 0 && (
        <section aria-labelledby="best-uses-heading">
          <div className="uppercase text-xs tracking-[2.5px] text-[#C5A46E] mb-3">
            BEST USES
          </div>
          <h2 id="best-uses-heading" className="sr-only">
            Best uses for this fabric
          </h2>
          <div className="flex flex-wrap gap-2">
            {p.bestUses.map((use) => (
              <span
                key={use}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E8DFD0] bg-[#FBF8F3] text-sm font-medium text-[#2C2522]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A46E]" aria-hidden="true" />
                {formatOccasion(use)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Fabric facts: width / weight / opacity */}
      {highlight.length > 0 && (
        <section aria-labelledby="fabric-facts-heading">
          <div className="uppercase text-xs tracking-[2.5px] text-[#C5A46E] mb-4">
            FABRIC FACTS
          </div>
          <h2 id="fabric-facts-heading" className="sr-only">
            Width, weight, and opacity
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {highlight.map((row) => (
              <div
                key={row.key}
                className="rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3.5"
              >
                <div className="text-[10px] tracking-[0.15em] uppercase text-[#A89B8A] mb-1">
                  {row.key}
                </div>
                <div className="text-sm font-semibold text-[#2C2522] leading-snug">
                  {row.value}
                </div>
              </div>
            ))}
          </div>
          {(p.category === "Premium Lace" ||
            p.category === "Silk, Chiffon & Voile") && (
            <p className="text-xs text-[#6B5F54] mt-3 leading-relaxed">
              Tip: sheer and semi-sheer fabrics usually need lining for bridal and asoebi. Check{" "}
              <span className="font-medium text-[#2C2522]">Opacity</span> above before you cut.
            </p>
          )}
        </section>
      )}

      {/* Care */}
      {p.careInstructions && (
        <section
          aria-labelledby="care-heading"
          className="rounded-3xl border border-[#D4C9B8] bg-white p-6 sm:p-7"
        >
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4 text-[#6B2D3C]" aria-hidden="true" />
            <div className="uppercase text-xs tracking-[2.5px] text-[#C5A46E]">
              CARE INSTRUCTIONS
            </div>
          </div>
          <h2 id="care-heading" className="sr-only">
            Care instructions
          </h2>
          <p className="text-sm text-[#4A4038] leading-relaxed">{p.careInstructions}</p>
        </section>
      )}

      {/* Origin / artisan */}
      {p.originStory && (
        <section
          aria-labelledby="origin-heading"
          className="rounded-3xl border border-[#E8DFD0] bg-gradient-to-br from-[#FBF8F3] to-white p-6 sm:p-7"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-[#C5A46E]" aria-hidden="true" />
            <div className="uppercase text-xs tracking-[2.5px] text-[#C5A46E]">
              ORIGIN & ARTISAN NOTE
            </div>
          </div>
          <h2 id="origin-heading" className="text-lg font-semibold tracking-tight mb-2">
            From market to your wardrobe
          </h2>
          <p className="text-sm text-[#4A4038] leading-relaxed">{p.originStory}</p>
        </section>
      )}

      {/* Full specs table (remaining keys) */}
      <section aria-labelledby="specs-heading">
        <div className="uppercase text-xs tracking-[2.5px] text-[#C5A46E] mb-4">
          SPECIFICATIONS
        </div>
        <h2 id="specs-heading" className="sr-only">
          Full specifications
        </h2>
        <div className="border border-[#D4C9B8] rounded-3xl overflow-hidden text-sm">
          {Object.entries(p.specifications)
            .filter(([key]) => !["Care", "Best uses", "Artisan note"].includes(key))
            .map(([key, value]) => (
              <div
                key={key}
                className="flex border-b last:border-b-0 border-[#D4C9B8] px-6 py-[17px] bg-white"
              >
                <div className="w-36 sm:w-44 text-[#6B5F54] shrink-0">{key}</div>
                <div className="font-medium text-[#2C2522]">{value}</div>
              </div>
            ))}
        </div>
      </section>

      {/* How to style — use best uses */}
      <section aria-labelledby="style-heading">
        <div className="uppercase text-xs tracking-[2.5px] text-[#C5A46E] mb-4">
          HOW TO STYLE THIS FABRIC
        </div>
        <h2 id="style-heading" className="sr-only">
          How to style
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-white border border-[#D4C9B8] rounded-3xl p-6">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C5A46E]" aria-hidden="true" />
              Traditional look
            </div>
            <p className="text-[#6B5F54] leading-relaxed">
              {(p.bestUses || []).some((u) =>
                ["asoebi", "bridal", "gele", "wrapper"].includes(u.toLowerCase()),
              )
                ? "Pair with matching gele and ipele for asoebi, owambe, or bridal ensembles. Ask your tailor for a unified colour story."
                : "Work with your tailor on classic silhouettes — clean lines, quality finishing, and room to move."}
            </p>
          </div>
          <div className="bg-white border border-[#D4C9B8] rounded-3xl p-6">
            <div className="font-semibold mb-2">Modern fusion</div>
            <p className="text-[#6B5F54] leading-relaxed">
              {(p.bestUses || []).some((u) =>
                ["office", "everyday", "senator"].includes(u.toLowerCase()),
              )
                ? "Think shirt dresses, tailored trousers, blazers, or senator cuts for contemporary polish."
                : "Try a structured jacket, wide-leg trouser, or minimal gown for a modern silhouette."}
            </p>
          </div>
        </div>
      </section>

      <FabricCalculatorCta
        productName={p.name}
        category={p.category}
        variant="card"
      />

      <p className="text-xs text-[#8A7E72]">
        Need help choosing?{" "}
        <Link href="/contact" className="text-[#6B2D3C] underline underline-offset-2">
          Message our team
        </Link>{" "}
        or read the{" "}
        <Link href="/journal" className="text-[#6B2D3C] underline underline-offset-2">
          fabric journal
        </Link>
        .
      </p>
    </div>
  );
}
