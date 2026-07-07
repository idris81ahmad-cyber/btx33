"use client";

import { useState } from "react";
import Link from "next/link";
import { garmentPresets, calculateTotalYards } from "@/lib/fabric-calculator";
import { Button } from "@/components/ui/button";

export default function FabricCalculatorPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [customYards, setCustomYards] = useState(0);
  const [allowance, setAllowance] = useState(10);

  const baseYards = calculateTotalYards(selected, customYards);
  const withAllowance = Math.ceil(baseYards * (1 + allowance / 100));

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-14 pb-24">
      <div className="text-center mb-10">
        <div className="text-xs tracking-[3px] text-[#C5A46E]">FABRIC PLANNING</div>
        <h1 className="text-5xl font-semibold tracking-tight mt-2">How much fabric do I need?</h1>
        <p className="text-[#6B5F54] mt-3 max-w-xl mx-auto">
          Select the garments you plan to make. We add a safety allowance for shrinkage, pattern matching, and tailoring waste — just like our Kantin Kwari tailors recommend.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {garmentPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => toggle(preset.id)}
            className={`text-left p-5 rounded-3xl border transition ${
              selected.includes(preset.id)
                ? "border-[#6B2D3C] bg-[#F8F4EC] ring-1 ring-[#6B2D3C]"
                : "border-[#D4C9B8] bg-white hover:border-[#C5A46E]"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{preset.name}</div>
                <div className="text-sm text-[#6B5F54] mt-1">{preset.description}</div>
                <div className="text-xs text-[#C5A46E] mt-2">{preset.category}</div>
              </div>
              <div className="font-mono font-semibold text-lg shrink-0">{preset.yards} yd</div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#D4C9B8] rounded-3xl p-6 mb-8 space-y-5">
        <div>
          <label className="text-xs tracking-widest text-[#6B5F54]">EXTRA YARDS (custom pieces)</label>
          <input
            type="number"
            min={0}
            value={customYards}
            onChange={(e) => setCustomYards(Math.max(0, parseInt(e.target.value) || 0))}
            className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest text-[#6B5F54]">
            SAFETY ALLOWANCE ({allowance}%)
          </label>
          <input
            type="range"
            min={0}
            max={25}
            value={allowance}
            onChange={(e) => setAllowance(parseInt(e.target.value))}
            className="w-full mt-2 accent-[#6B2D3C]"
          />
          <p className="text-xs text-[#6B5F54] mt-1">Recommended 10–15% for lace and brocade pattern matching.</p>
        </div>
      </div>

      <div className="bg-[#2C2522] text-white rounded-3xl p-8 text-center">
        <div className="text-[#C5A46E] text-xs tracking-[3px] mb-2">YOUR ESTIMATE</div>
        <div className="text-6xl font-semibold font-mono tabular-nums">{withAllowance}</div>
        <div className="text-lg mt-1">yards total</div>
        {baseYards > 0 && (
          <p className="text-[#A89B8A] text-sm mt-3">
            Base: {baseYards} yards + {allowance}% allowance
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-[#C5A46E] text-[#2C2522] hover:bg-[#d4b87a] rounded-2xl">
            <Link href="/shop">Shop fabrics →</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-2xl">
            <Link href="/contact">Ask a tailor</Link>
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-[#6B5F54] mt-8">
        Estimates are guides only. Body size, style, and fabric width affect final yardage. WhatsApp us for bespoke advice.
      </p>
    </div>
  );
}