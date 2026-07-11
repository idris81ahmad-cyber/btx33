import { NextResponse } from "next/server";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { fulfillPaystackPayment } from "@/lib/paystack-orders";
import type { PaystackTransactionData } from "@/lib/paystack-types";

export async function POST(req: Request) {
  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    console.warn("[Paystack Webhook] Invalid signature received");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: PaystackTransactionData };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch (parseError) {
    console.error("[Paystack Webhook] Failed to parse JSON body:", parseError);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`[Paystack Webhook] Received event: ${event.event}`);

  if (event.event === "charge.success" && event.data) {
    const reference = event.data.reference;
    console.log(
      `[Paystack Webhook] Fulfilling charge.success for reference: ${reference}`,
    );

    try {
      // Ensure status is success (Paystack charge.success always is, but be explicit)
      const paymentData: PaystackTransactionData = {
        ...event.data,
        status: event.data.status || "success",
      };

      const result = await fulfillPaystackPayment(paymentData);

      if (result.ok) {
        console.log(
          `[Paystack Webhook] Order ${reference} fulfilled` +
            (result.alreadyExists ? " (already confirmed)" : " (newly confirmed)"),
        );
      } else {
        console.error(
          `[Paystack Webhook] Fulfill failed for ${reference}:`,
          result.error,
        );
      }
    } catch (error) {
      console.error(
        "[Paystack Webhook] Error processing charge.success event:",
        error,
      );
      // Still return 200 so Paystack does not retry forever for app bugs
    }
  } else {
    console.log(
      `[Paystack Webhook] Ignoring unhandled event type: ${event.event}`,
    );
  }

  return NextResponse.json({ received: true });
}
