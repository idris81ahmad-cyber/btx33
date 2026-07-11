import { NextRequest, NextResponse } from "next/server";
import { initializePaystackPayment, isPaystackConfigured } from "@/lib/paystack";
import type { PaystackPaymentMetadata } from "@/lib/paystack-types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json(
        { error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY to environment variables." },
        { status: 503 },
      );
    }

    const session = await getServerSession(authOptions);
    const body = (await request.json()) as {
      email?: string;
      amount?: number;
      metadata?: PaystackPaymentMetadata;
    };

    const { email, amount, metadata = {} } = body;

    if (!email || amount == null || amount <= 0) {
      return NextResponse.json({ error: "Valid email and amount are required" }, { status: 400 });
    }

    const reference = `BIYORA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biyora-shop.vercel.app";

    const result = await initializePaystackPayment({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: `${siteUrl}/checkout/success?reference=${reference}`,
      metadata: {
        ...metadata,
        userId: session?.user?.id ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize payment";
    console.error("Paystack initialize error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}