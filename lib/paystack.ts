import { NextResponse } from 'next/server';

/**
 * Paystack Integration Helper for BIYORA SHOP
 * 
 * Usage:
 * - Initialize transaction on checkout
 * - Verify transaction on success/webhook
 */

const PAYSTACK_BASE = 'https://api.paystack.co';

const getPaystackSecret = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not set in environment variables');
  }
  return key;
};

interface InitializePaymentParams {
  email: string;
  amount: number; // in kobo (multiply NGN by 100)
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
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

/**
 * Initialize a Paystack transaction
 */
export async function initializePaystackPayment(
  params: InitializePaymentParams
): Promise<PaystackInitializeResponse> {
  const secretKey = getPaystackSecret();

  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount, // Paystack expects kobo
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to initialize Paystack payment');
  }

  return response.json();
}

/**
 * Verify a Paystack transaction
 */
export async function verifyPaystackPayment(reference: string) {
  const secretKey = getPaystackSecret();

  const response = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${reference}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to verify Paystack payment');
  }

  return response.json();
}

/**
 * Webhook verification helper (for future use)
 */
export function verifyPaystackWebhookSignature(
  payload: string,
  signature: string
): boolean {
  // TODO: Implement proper HMAC verification using PAYSTACK_WEBHOOK_SECRET
  // For now, basic placeholder
  return true;
}
