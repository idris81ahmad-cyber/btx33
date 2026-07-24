export type StockTone = "out" | "urgent" | "low" | "ok";

export type StockMessage = {
  tone: StockTone;
  text: string;
  /** Show on product cards / PDP */
  show: boolean;
};

/**
 * Soft urgency copy — never spammy.
 * ≤0 restocking, 1–4 "only N left", 5–10 low stock, else quiet.
 */
export function getStockMessage(inStock: number): StockMessage {
  const n = Math.floor(Number(inStock) || 0);
  if (n <= 0) {
    return { tone: "out", text: "Restocking soon", show: true };
  }
  if (n <= 4) {
    return {
      tone: "urgent",
      text: n === 1 ? "Only 1 left" : `Only ${n} left`,
      show: true,
    };
  }
  if (n <= 10) {
    return { tone: "low", text: `${n} remaining`, show: true };
  }
  return { tone: "ok", text: "In stock", show: false };
}

export function stockToneClass(tone: StockTone): string {
  switch (tone) {
    case "out":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "urgent":
      return "bg-[#6B2D3C]/10 text-[#6B2D3C] border-[#6B2D3C]/20";
    case "low":
      return "bg-[#F8F4EC] text-[#6B5F54] border-[#E8DFD0]";
    default:
      return "bg-emerald-50 text-emerald-800 border-emerald-100";
  }
}
