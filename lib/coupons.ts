export interface Coupon {
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
}

const COUPONS: Coupon[] = [
  { code: "KWARI10", label: "10% off Kwari welcome", type: "percent", value: 10, minSubtotal: 25_000 },
  { code: "BIYORA5000", label: "₦5,000 off orders over ₦50,000", type: "fixed", value: 5_000, minSubtotal: 50_000 },
  { code: "FABRIC15", label: "15% off premium fabrics", type: "percent", value: 15, minSubtotal: 75_000 },
];

export function listPublicCoupons(): Pick<Coupon, "code" | "label" | "minSubtotal">[] {
  return COUPONS.map(({ code, label, minSubtotal }) => ({ code, label, minSubtotal }));
}

export function validateCoupon(
  code: string,
  subtotal: number,
):
  | { valid: true; coupon: Coupon; discount: number }
  | { valid: false; message: string } {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, message: "Enter a coupon code" };
  }

  const coupon = COUPONS.find((c) => c.code === normalized);

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      valid: false,
      message: `Minimum order of ₦${coupon.minSubtotal.toLocaleString()} required for ${coupon.code}`,
    };
  }

  const discount =
    coupon.type === "percent"
      ? Math.round(subtotal * (coupon.value / 100))
      : Math.min(coupon.value, subtotal);

  return { valid: true, coupon, discount: Math.max(0, discount) };
}