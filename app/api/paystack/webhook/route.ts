import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { fulfillPaystackPayment } from "@/lib/paystack-orders";
import type { PaystackWebhookPayload } from "@/lib/paystack-types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    console.error("Paystack webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PaystackWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ received: true, skipped: payload.event });
  }

  const result = await fulfillPaystackPayment(payload.data);

  if (!result.ok) {
    console.error("Paystack webhook fulfillment failed:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    received: true,
    orderNumber: result.order?.orderNumber,
    alreadyExists: result.alreadyExists ?? false,
  });
}