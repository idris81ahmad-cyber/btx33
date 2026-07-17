import { NextRequest, NextResponse } from "next/server";
import { listPublicCoupons, validateCoupon } from "@/lib/coupons";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Public list of coupon teasers (no secret amounts beyond labels). */
export async function GET() {
  return NextResponse.json(
    { coupons: listPublicCoupons() },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}

/** Validate a code against a subtotal — used by cart / checkout clients. */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rl = rateLimit(`coupons:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many coupon attempts. Please wait a minute." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json()) as { code?: string; subtotal?: number };
    const code = typeof body.code === "string" ? body.code : "";
    const subtotal = Number(body.subtotal) || 0;
    const result = validateCoupon(code, subtotal);
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }
    return NextResponse.json(
      {
        valid: true,
        code: result.coupon.code,
        label: result.coupon.label,
        discount: result.discount,
        type: result.coupon.type,
        value: result.coupon.value,
      },
      { headers: rateLimitHeaders(rl) },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
