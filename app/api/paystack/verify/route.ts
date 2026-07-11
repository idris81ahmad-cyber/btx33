import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackPayment } from "@/lib/paystack";
import { fulfillPaystackPayment } from "@/lib/paystack-orders";
import { getOrderByNumber } from "@/lib/db/orders";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { reference?: string };
    const reference = body.reference?.trim();

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    // Fast path: order already confirmed (e.g. webhook won the race)
    const existing = await getOrderByNumber(reference);
    if (existing && existing.status !== "pending") {
      return NextResponse.json({
        success: true,
        order: {
          ...existing,
          createdAt:
            existing.createdAt instanceof Date
              ? existing.createdAt.toISOString()
              : existing.createdAt,
        },
        alreadyExists: true,
        emailSent: true,
      });
    }

    const verification = await verifyPaystackPayment(reference);

    if (!verification.status || verification.data?.status !== "success") {
      // Payment not successful yet — if we have pending order, keep it pending
      return NextResponse.json(
        {
          success: false,
          message:
            verification.message ||
            "Payment not confirmed yet. If you were charged, wait a moment and retry.",
          paystackStatus: verification.data?.status,
        },
        { status: 400 },
      );
    }

    const result = await fulfillPaystackPayment(verification.data);

    if (!result.ok) {
      // Last resort: re-read order (webhook may have confirmed mid-flight)
      const recovered = await getOrderByNumber(reference);
      if (recovered && recovered.status !== "pending") {
        return NextResponse.json({
          success: true,
          order: {
            ...recovered,
            createdAt:
              recovered.createdAt instanceof Date
                ? recovered.createdAt.toISOString()
                : recovered.createdAt,
          },
          alreadyExists: true,
          emailSent: true,
        });
      }

      console.error("[Paystack Verify] Fulfill failed:", result.error, {
        reference,
      });
      return NextResponse.json(
        {
          success: false,
          message:
            result.error ||
            "Payment succeeded but order finalization failed. Contact support with your reference.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      alreadyExists: result.alreadyExists ?? false,
      emailSent: result.emailSent ?? false,
      emailDemo: result.emailDemo ?? false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify payment";
    console.error("Paystack verify error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
