"use client";

import { Tag, X } from "lucide-react";
import type { Coupon } from "@/lib/coupons";
import { cn } from "@/lib/utils";

type CouponPanelProps = {
  couponInput: string;
  onInputChange: (value: string) => void;
  appliedCoupon: Coupon | null;
  discount: number;
  couponMessage: string;
  onApply: () => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
  idPrefix?: string;
};

export default function CouponPanel({
  couponInput,
  onInputChange,
  appliedCoupon,
  discount,
  couponMessage,
  onApply,
  onRemove,
  disabled,
  className,
  idPrefix = "coupon",
}: CouponPanelProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={idPrefix}
        className="text-xs text-[#6B5F54] flex items-center gap-1.5 font-medium"
      >
        <Tag className="w-3.5 h-3.5" aria-hidden="true" />
        Coupon code
      </label>

      {appliedCoupon ? (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-emerald-800/80 font-medium">
                Savings applied
              </p>
              <p className="font-mono font-semibold text-emerald-950 text-sm mt-0.5">
                {appliedCoupon.code}
              </p>
              <p className="text-xs text-emerald-800 mt-0.5 truncate">
                {appliedCoupon.label}
              </p>
              <p className="text-base font-semibold text-emerald-900 mt-2 tabular-nums">
                −₦{discount.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900 border border-emerald-300 rounded-xl px-3 py-2 min-h-[40px] hover:bg-emerald-100/80 transition disabled:opacity-50"
              aria-label={`Remove coupon ${appliedCoupon.code}`}
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              id={idPrefix}
              type="text"
              value={couponInput}
              onChange={(e) => onInputChange(e.target.value.toUpperCase())}
              placeholder="e.g. KWARI10"
              disabled={disabled}
              className="input-premium flex-1 min-h-[44px] text-sm font-mono"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApply();
                }
              }}
            />
            <button
              type="button"
              onClick={onApply}
              disabled={disabled || !couponInput.trim()}
              className="px-4 rounded-2xl border border-[#D4C9B8] text-sm font-medium min-h-[44px] hover:bg-[#F8F4EC] disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {couponMessage && (
            <p className="text-xs text-amber-800" role="status">
              {couponMessage}
            </p>
          )}
        </>
      )}
    </div>
  );
}
