import { NextResponse } from "next/server";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { fulfillPaystackPayment } from "@/lib/paystack-orders";
import type { PaystackTransactionData } from "@/lib/paystack-types";
import { logger } from "@/lib/logger";
import { validateEnvOnce, isPaystackEnvReady } from "@/lib/env";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * GET — health/config check for webhook endpoint (no secrets).
 * Use after deploy + when configuring Paystack dashboard.
 */
export async function GET() {
  validateEnvOnce();
  return NextResponse.json({
    ok: true,
    endpoint: "/api/paystack/webhook",
    paystackConfigured: isPaystackEnvReady(),
    expects: "POST charge.success with x-paystack-signature",
    productionUrl: "https://biyora-shop.vercel.app/api/paystack/webhook",
  });
}

export async function POST(req: Request) {
  validateEnvOnce();

  const ip = clientIp(req);
  // Blunt invalid-signature / flood traffic; real Paystack volume is low
  const rl = rateLimit(`paystack-webhook:${ip}`, {
    limit: 120,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    logger.warn("paystack-webhook", "Invalid signature", { ip });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: PaystackTransactionData };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    logger.error("paystack-webhook", "Invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  logger.ops("paystack-webhook", "Event received", {
    event: event.event,
    reference: event.data?.reference,
  });

  if (event.event === "charge.success" && event.data) {
    const reference = event.data.reference;
    try {
      const paymentData: PaystackTransactionData = {
        ...event.data,
        status: event.data.status || "success",
      };

      const result = await fulfillPaystackPayment(paymentData);

      if (!result.ok) {
        // Non-2xx so Paystack retries — critical for reliability when verify path fails
        logger.error("paystack-webhook", "Fulfill failed — requesting Paystack retry", {
          reference,
          error: result.error,
        });
        return NextResponse.json(
          { received: false, error: result.error || "fulfill_failed" },
          { status: 500 },
        );
      }

      logger.ops("paystack-webhook", "Order fulfilled", {
        reference,
        alreadyExists: Boolean(result.alreadyExists),
        emailSent: result.emailSent,
      });

      return NextResponse.json({
        received: true,
        reference,
        alreadyExists: result.alreadyExists ?? false,
      });
    } catch (error) {
      logger.error("paystack-webhook", "Unhandled fulfill error", {
        reference,
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { received: false, error: "internal_error" },
        { status: 500 },
      );
    }
  }

  // Acknowledge other events so Paystack does not retry forever
  return NextResponse.json({ received: true, ignored: event.event });
}
