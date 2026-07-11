import type { OrderItemJson, ShippingJson } from "@/lib/db/schema";

export interface PaystackPaymentMetadata {
  fullName?: string;
  phone?: string;
  shipping?: ShippingJson;
  cartItems?: OrderItemJson[];
  shippingFee?: number;
  discount?: number;
  userId?: string | number | null;
  notes?: string;
}

export interface PaystackTransactionData {
  reference: string;
  amount: number;
  status: string;
  customer: {
    email: string;
  };
  metadata?: PaystackPaymentMetadata;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackTransactionData;
}

export interface PaystackWebhookPayload {
  event: string;
  data: PaystackTransactionData;
}