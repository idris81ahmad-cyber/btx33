import { NextRequest, NextResponse } from "next/server";
import { initializePaystackPayment, isPaystackConfigured } from "@/lib/paystack";
import type { PaystackPaymentMetadata } from "@/lib/paystack-types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrder } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";
import { parseUserId } from "@/lib/paystack-orders";
import type { OrderItemJson, ShippingJson } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json(
        {
          error:
            "Paystack is not configured. Add PAYSTACK_SECRET_KEY to environment variables.",
        },
        { status: 503 },
      );
    }

    if (!hasDatabase()) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Orders cannot be saved. Add POSTGRES_URL / DATABASE_URL.",
        },
        { status: 503 },
      );
    }

    const session = await getServerSession(authOptions);
    const body = (await request.json()) as {
      email?: string;
      amount?: number;
      metadata?: PaystackPaymentMetadata & {
        shipping?: ShippingJson;
        cartItems?: OrderItemJson[];
        subtotal?: number;
      };
    };

    const { email, amount, metadata = {} } = body;

    if (!email || amount == null || amount <= 0) {
      return NextResponse.json(
        { error: "Valid email and amount are required" },
        { status: 400 },
      );
    }

    const cartItems = Array.isArray(metadata.cartItems) ? metadata.cartItems : [];
    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty — add items before payment" },
        { status: 400 },
      );
    }

    const shipping: ShippingJson = {
      fullName: metadata.shipping?.fullName || metadata.fullName || "Customer",
      phone: metadata.shipping?.phone || metadata.phone || "",
      address: metadata.shipping?.address || "",
      city: metadata.shipping?.city || "",
      state: metadata.shipping?.state || "",
      postalCode: metadata.shipping?.postalCode,
      country: metadata.shipping?.country || "Nigeria",
    };

    if (!shipping.phone || !shipping.address || !shipping.city || !shipping.state) {
      return NextResponse.json(
        { error: "Complete shipping details are required before payment" },
        { status: 400 },
      );
    }

    const reference = `BIYORA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    // Prefer stable production domain so Paystack never redirects to a stale deployment URL
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      "https://biyora-shop.vercel.app"
    ).replace(/\/$/, "");

    const shippingFee = Number(metadata.shippingFee) || 0;
    const discount = Number(metadata.discount) || 0;
    const subtotal =
      Number(metadata.subtotal) ||
      cartItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
    const total = Math.round(Number(amount));

    const userId = parseUserId(metadata.userId ?? session?.user?.id);

    // Create pending order BEFORE redirect so verify never depends on Paystack metadata size/shape
    const pending = await createOrder({
      orderNumber: reference,
      userId,
      email: email.trim(),
      fullName: shipping.fullName,
      phone: shipping.phone,
      items: cartItems,
      shipping,
      subtotal,
      shippingFee,
      discount,
      total,
      paymentMethod: "paystack",
      notes: metadata.notes,
      status: "pending",
    });

    if (!pending) {
      return NextResponse.json(
        {
          error:
            "Could not create order before payment. Please try again or contact support.",
        },
        { status: 500 },
      );
    }

    // Keep Paystack metadata small — cart lives in our DB under this reference
    const result = await initializePaystackPayment({
      email: email.trim(),
      amount: Math.round(total * 100),
      reference,
      callback_url: `${siteUrl.replace(/\/$/, "")}/checkout/success?reference=${encodeURIComponent(reference)}`,
      metadata: {
        orderNumber: reference,
        fullName: shipping.fullName,
        phone: shipping.phone,
        userId: userId ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize payment";
    console.error("Paystack initialize error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
