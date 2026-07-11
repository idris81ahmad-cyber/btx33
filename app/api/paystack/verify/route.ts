import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackPayment } from "@/lib/paystack";
import { fulfillPaystackPayment } from "@/lib/paystack-orders";
import { getOrderByNumber } from "@/lib/db/orders";
import { ensurePostgresEnv, hasDatabase } from "@/lib/db";

function serializeOrder(order: {
  createdAt?: Date | string | null;
  [key: string]: unknown;
}) {
  return {
    ...order,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Ensure Neon DATABASE_URL is mirrored into POSTGRES_URL for @vercel/postgres
    ensurePostgresEnv();

    const body = (await request.json()) as { reference?: string };
    const reference = body.reference?.trim();

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    // Fast path: order already confirmed (e.g. webhook won the race)
    if (hasDatabase()) {
      const existing = await getOrderByNumber(reference);
      if (existing && existing.status !== "pending") {
        return NextResponse.json({
          success: true,
          order: serializeOrder(existing),
          alreadyExists: true,
          emailSent: true,
        });
      }
    }

    const verification = await verifyPaystackPayment(reference);

    if (!verification.status || verification.data?.status !== "success") {
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

    // Payment is confirmed with Paystack — always surface success to the customer
    // even if DB fulfillment has a transient issue.
    const payment = verification.data;
    const paidTotal = Math.round((payment.amount || 0) / 100);

    try {
      const result = await fulfillPaystackPayment(payment);

      if (result.ok && result.order) {
        return NextResponse.json({
          success: true,
          order: result.order,
          alreadyExists: result.alreadyExists ?? false,
          emailSent: result.emailSent ?? false,
          emailDemo: result.emailDemo ?? false,
        });
      }

      const recovered = hasDatabase() ? await getOrderByNumber(reference) : null;
      if (recovered) {
        return NextResponse.json({
          success: true,
          order: serializeOrder(recovered),
          alreadyExists: true,
          emailSent: true,
        });
      }

      console.error("[Paystack Verify] Fulfill failed after successful payment:", result.error, {
        reference,
        hasDatabase: hasDatabase(),
        postgresUrlSet: Boolean(process.env.POSTGRES_URL),
        databaseUrlSet: Boolean(process.env.DATABASE_URL),
      });

      // Customer-facing success with synthetic order so UI does not show an error
      return NextResponse.json({
        success: true,
        order: {
          id: 0,
          orderNumber: reference,
          email: payment.customer?.email || "",
          fullName: (payment.metadata as { fullName?: string } | undefined)?.fullName || "Customer",
          total: paidTotal,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          items: [],
          shipping: undefined,
        },
        alreadyExists: false,
        emailSent: false,
        partial: true,
        message:
          result.error ||
          "Payment confirmed. Order details will appear shortly — save your reference.",
      });
    } catch (fulfillError) {
      console.error("[Paystack Verify] Fulfill threw after successful payment:", fulfillError);
      return NextResponse.json({
        success: true,
        order: {
          id: 0,
          orderNumber: reference,
          email: payment.customer?.email || "",
          fullName: "Customer",
          total: paidTotal,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          items: [],
        },
        alreadyExists: false,
        emailSent: false,
        partial: true,
        message:
          "Payment confirmed by Paystack. We are still saving order details — keep your reference.",
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify payment";
    console.error("Paystack verify error:", error, {
      hasDatabase: hasDatabase(),
      postgresUrlSet: Boolean(process.env.POSTGRES_URL),
      databaseUrlSet: Boolean(process.env.DATABASE_URL),
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
