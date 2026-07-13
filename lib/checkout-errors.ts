export type CheckoutErrorCode =
  | "EMPTY_CART"
  | "OUT_OF_STOCK"
  | "VALIDATION"
  | "PAYMENT_UNAVAILABLE"
  | "PAYMENT_INIT_FAILED"
  | "RATE_LIMITED"
  | "INVALID_RESPONSE"
  | "NETWORK"
  | "UNKNOWN";

export interface CheckoutError {
  code: CheckoutErrorCode;
  title: string;
  message: string;
  action?: string;
}

/** Shared copy so checkout, success, and toasts stay consistent. */
export const CHECKOUT_COPY = {
  emptyCart: {
    code: "EMPTY_CART" as const,
    title: "Your cart is empty",
    message: "Add fabrics to your cart before checking out.",
    action: "Browse the shop and add items you love.",
  },
  network: {
    code: "NETWORK" as const,
    title: "Connection problem",
    message: "We could not reach the server. Check your internet and try again.",
    action: "Retry when you are back online.",
  },
  rateLimited: {
    code: "RATE_LIMITED" as const,
    title: "Too many attempts",
    message: "Please wait a minute before trying again.",
    action: "This protects your account and our payment system.",
  },
  chargedUnsure: {
    title: "Payment may have succeeded",
    message:
      "If money left your account, do not pay again. Retry verification or contact support with your reference.",
    action: "Save your payment reference for support.",
  },
} satisfies Record<string, CheckoutError | { title: string; message: string; action?: string }>;

export function mapPaymentInitError(status: number, apiError?: string): CheckoutError {
  if (status === 429) {
    return {
      ...CHECKOUT_COPY.rateLimited,
      message: apiError || CHECKOUT_COPY.rateLimited.message,
    };
  }

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
      message:
        apiError ||
        "Our payment service returned an error. Your card was not charged.",
      action: "Wait a moment and try again. You have not been charged.",
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
      ...CHECKOUT_COPY.network,
      message: apiError || CHECKOUT_COPY.network.message,
    };
  }

  if (status === 429) {
    return {
      ...CHECKOUT_COPY.rateLimited,
      message: apiError || CHECKOUT_COPY.rateLimited.message,
    };
  }

  if (status === 400) {
    return {
      code: "VALIDATION",
      title: "Payment not confirmed yet",
      message:
        apiError ||
        "Paystack has not marked this payment as successful yet.",
      action:
        "If you were charged, wait a minute and tap Retry verification. Do not pay twice.",
    };
  }

  if (status === 500) {
    return {
      code: "PAYMENT_INIT_FAILED",
      title: "Order processing delayed",
      message:
        apiError ||
        "Your payment may have succeeded but we could not finalize the order yet.",
      action:
        "Retry verification. If it keeps failing, contact support with your payment reference.",
    };
  }

  return {
    code: "UNKNOWN",
    title: "Verification pending",
    message:
      apiError ||
      "We could not confirm your payment yet. If you were charged, your order will appear shortly.",
    action: "Retry in a moment or contact support with your payment reference.",
  };
}
