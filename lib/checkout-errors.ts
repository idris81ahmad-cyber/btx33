export type CheckoutErrorCode =
  | "EMPTY_CART"
  | "OUT_OF_STOCK"
  | "VALIDATION"
  | "PAYMENT_UNAVAILABLE"
  | "PAYMENT_INIT_FAILED"
  | "INVALID_RESPONSE"
  | "NETWORK"
  | "UNKNOWN";

export interface CheckoutError {
  code: CheckoutErrorCode;
  title: string;
  message: string;
  action?: string;
}

export function mapPaymentInitError(status: number, apiError?: string): CheckoutError {
  if (status === 503) {
    return {
      code: "PAYMENT_UNAVAILABLE",
      title: "Payments unavailable",
      message:
        apiError ||
        "Online payments are temporarily unavailable. Please try again in a few minutes or contact us on WhatsApp.",
      action: "Try again shortly or reach out via our contact page.",
    };
  }

  if (status === 400) {
    return {
      code: "VALIDATION",
      title: "Checkout details incomplete",
      message: apiError || "Please review your shipping details and try again.",
      action: "Fix the highlighted fields above.",
    };
  }

  if (status >= 500) {
    return {
      code: "PAYMENT_INIT_FAILED",
      title: "Could not start payment",
      message: apiError || "Our payment service returned an error. Your card was not charged.",
      action: "Wait a moment and try again.",
    };
  }

  return {
    code: "PAYMENT_INIT_FAILED",
    title: "Payment could not start",
    message: apiError || "Failed to initialize payment. Your card was not charged.",
    action: "Try again or use a different payment method on Paystack.",
  };
}

export function mapVerifyError(status: number, apiError?: string): CheckoutError {
  if (status === 0) {
    return {
      code: "NETWORK",
      title: "Connection problem",
      message: apiError || "Could not reach the server to verify your payment.",
      action: "Check your connection and tap Retry verification.",
    };
  }

  if (status === 400) {
    return {
      code: "VALIDATION",
      title: "Payment not confirmed",
      message: apiError || "Paystack could not verify this payment as successful.",
      action: "If you were charged, wait a minute and tap Retry verification.",
    };
  }

  if (status === 500) {
    return {
      code: "PAYMENT_INIT_FAILED",
      title: "Order processing delayed",
      message:
        apiError ||
        "Your payment may have succeeded but we could not finalize the order yet.",
      action: "Retry verification. If the issue persists, contact support with your reference.",
    };
  }

  return {
    code: "UNKNOWN",
    title: "Verification pending",
    message:
      apiError ||
      "We could not confirm your payment yet. If you were charged, your order will be confirmed shortly.",
    action: "Retry in a moment or contact support with your payment reference.",
  };
}