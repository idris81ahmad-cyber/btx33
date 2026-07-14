import { NextRequest, NextResponse } from "next/server";
import { initializePaystackPayment, isPaystackConfigured } from "@/lib/paystack";
import type { PaystackPaymentMetadata } from "@/lib/paystack-types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrder } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";
import { getUserByEmail } from "@/lib/db/users";
import { parseUserId } from "@/lib/paystack-orders";
import type { OrderItemJson, ShippingJson } from "@/lib/db/schema";
import { validateEnvOnce } from "@/lib/env";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validateCoupon } from "@/lib/coupons";

export async function POST(request: NextRequest) {
  try {
    validateEnvOnce();

    const ip = clientIp(request);
    const rl = rateLimit(`paystack-init:${ip}`, { limit: 15, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please wait a minute and try again." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

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
        couponCode?: string;
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
    const subtotal =
      Number(metadata.subtotal) ||
      cartItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);

    // Re-validate coupon server-side so clients cannot forge discounts
    let discount = 0;
    let couponCode: string | undefined;
    const rawCoupon = metadata.couponCode?.trim();
    if (rawCoupon) {
      const result = validateCoupon(rawCoupon, subtotal);
      if (!result.valid) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      discount = result.discount;
      couponCode = result.coupon.code;
    }

    const expectedTotal = Math.max(0, Math.round(subtotal + shippingFee - discount));
    const total = Math.round(Number(amount));
    if (Math.abs(total - expectedTotal) > 1) {
      return NextResponse.json(
        {
          error: `Amount mismatch. Expected ₦${expectedTotal.toLocaleString()} (subtotal + shipping − discount).`,
        },
        { status: 400 },
      );
    }

    // Resolve customer account so order history always links after login
    const checkoutEmail = email.trim().toLowerCase();
    let userId = parseUserId(metadata.userId ?? session?.user?.id);
    if (!userId && session?.user?.email) {
      const sessionUser = await getUserByEmail(session.user.email);
      if (sessionUser?.role === "customer" || sessionUser?.role === "admin") {
        userId = sessionUser.id;
      }
    }
    if (!userId) {
      const byCheckoutEmail = await getUserByEmail(checkoutEmail);
      if (byCheckoutEmail) userId = byCheckoutEmail.id;
    }

    // Prefer session email when logged in so account history always matches
    const orderEmail =
      session?.user?.email?.trim().toLowerCase() || checkoutEmail;

    // Create pending order BEFORE redirect so verify never depends on Paystack metadata size/shape
    const pending = await createOrder({
      orderNumber: reference,
      userId,
      email: orderEmail,
      fullName: shipping.fullName,
      phone: shipping.phone,
      items: cartItems,
      shipping,
      subtotal,
      shippingFee,
      discount,
      total: expectedTotal,
      paymentMethod: "paystack",
      notes: metadata.notes,
      couponCode,
      status: "pending",
    });

    logger.ops("paystack-init", "Pending order created", {
      reference,
      userId: userId ?? null,
      email: orderEmail,
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
      amount: Math.round(expectedTotal * 100),
      reference,
      callback_url: `${siteUrl.replace(/\/$/, "")}/checkout/success?reference=${encodeURIComponent(reference)}`,
      metadata: {
        orderNumber: reference,
        fullName: shipping.fullName,
        phone: shipping.phone,
        userId: userId ?? null,
        couponCode: couponCode ?? null,
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
    logger.error("paystack-init", message, {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
