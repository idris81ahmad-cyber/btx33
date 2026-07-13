import { AlertCircle, Info, WifiOff } from "lucide-react";
import type { CheckoutError } from "@/lib/checkout-errors";
import { cn } from "@/lib/utils";

type Variant = "error" | "warning" | "info";

const styles: Record<Variant, string> = {
  error: "bg-red-50 border-red-200 text-red-950",
  warning: "bg-amber-50 border-amber-200 text-amber-950",
  info: "bg-blue-50 border-blue-200 text-blue-950",
};

function pickVariant(code?: string): Variant {
  if (!code) return "error";
  if (code === "NETWORK" || code === "RATE_LIMITED") return "warning";
  if (code === "VALIDATION" || code === "OUT_OF_STOCK") return "warning";
  if (code === "PAYMENT_UNAVAILABLE") return "warning";
  return "error";
}

export default function ErrorBanner({
  error,
  title,
  message,
  action,
  className,
  role = "alert",
}: {
  error?: CheckoutError | null;
  title?: string;
  message?: string;
  action?: string;
  className?: string;
  role?: "alert" | "status";
}) {
  const t = error?.title || title;
  const m = error?.message || message;
  const a = error?.action || action;
  if (!t && !m) return null;

  const variant = pickVariant(error?.code);
  const Icon =
    error?.code === "NETWORK" ? WifiOff : variant === "info" ? Info : AlertCircle;

  return (
    <div
      role={role}
      aria-live="polite"
      className={cn(
        "p-4 rounded-2xl border text-sm flex gap-3",
        styles[variant],
        className,
      )}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        {t && <p className="font-medium">{t}</p>}
        {m && <p className={cn(t ? "mt-1 opacity-90" : "")}>{m}</p>}
        {a && <p className="mt-2 text-xs font-medium opacity-80">{a}</p>}
      </div>
    </div>
  );
}
