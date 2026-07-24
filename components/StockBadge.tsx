import { getStockMessage, stockToneClass } from "@/lib/stock-messaging";
import { cn } from "@/lib/utils";

export default function StockBadge({
  inStock,
  className,
  alwaysShow,
}: {
  inStock: number;
  className?: string;
  /** Force show even when stock is plentiful */
  alwaysShow?: boolean;
}) {
  const msg = getStockMessage(inStock);
  if (!msg.show && !alwaysShow) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border",
        stockToneClass(msg.tone),
        className,
      )}
    >
      {msg.text}
    </span>
  );
}
