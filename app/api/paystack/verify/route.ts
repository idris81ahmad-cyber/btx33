import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackPayment } from "@/lib/paystack";
import { fulfillPaystackPayment } from "@/lib/paystack-orders";

export async function POST(request: NextRequest) {
  try {
    const { reference } = (await request.json()) as { reference?: string };

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const verification = await verifyPaystackPayment(reference);

    if (!verification.status || verification.data.status !== "success") {
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 },
      );
    }

    const result = await fulfillPaystackPayment(verification.data);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.error || "Failed to fulfill order" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      alreadyExists: result.alreadyExists ?? false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    console.error("Paystack verify error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}