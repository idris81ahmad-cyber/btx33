import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaystackPaymentMetadata,
  PaystackVerifyResponse,
} from "@/lib/paystack-types";

const PAYSTACK_BASE = "https://api.paystack.co";

const getPaystackSecret = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables");
  }
  return key;
};

interface InitializePaymentParams {
  email: string;
  amount: number;
  reference?: string;
  callback_url?: string;
  metadata?: PaystackPaymentMetadata;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export async function initializePaystackPayment(
  params: InitializePaymentParams,
): Promise<PaystackInitializeResponse> {
  const secretKey = getPaystackSecret();

  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
      channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message || "Failed to initialize Paystack payment");
  }

  return response.json() as Promise<PaystackInitializeResponse>;
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  const secretKey = getPaystackSecret();

  const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to verify Paystack payment");
  }

  return response.json() as Promise<PaystackVerifyResponse>;
}

/**
 * Verify Paystack webhook signature (HMAC SHA512 of raw body).
 * @see https://paystack.com/docs/payments/webhooks/
 */
export function verifyPaystackWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;

  try {
    const secret = getPaystackSecret();
    const hash = createHmac("sha512", secret).update(payload).digest("hex");
    const hashBuffer = Buffer.from(hash, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    if (hashBuffer.length !== signatureBuffer.length) return false;
    return timingSafeEqual(hashBuffer, signatureBuffer);
  } catch {
    return false;
  }
}