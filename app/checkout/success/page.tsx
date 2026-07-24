"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertCircle, CheckCircle, Gift, Loader2, Mail, RefreshCw, UserPlus } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { mapVerifyError } from "@/lib/checkout-errors";
import ErrorBanner from "@/components/ErrorBanner";
import type { OrderItemJson, ShippingJson } from "@/lib/db/schema";
import { siteConfig } from "@/lib/site";

interface Order {
  id: number;
  orderNumber: string;
  email: string;
  fullName: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItemJson[];
  shipping?: ShippingJson;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  // Paystack may send `reference` and/or `trxref`
  const reference =
    searchParams.get("reference") || searchParams.get("trxref");
  const clearCart = useCartStore((s) => s.clearCart);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailDemo, setEmailDemo] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const verifyPayment = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!reference) {
        setError("No payment reference found. Return to checkout and try again.");
        setLoading(false);
        return;
      }

      if (!opts?.silent) {
        setLoading(true);
        setError("");
      }

      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        let data: {
          success?: boolean;
          order?: Order;
          message?: string;
          error?: string;
          emailSent?: boolean;
          emailDemo?: boolean;
          alreadyExists?: boolean;
          partial?: boolean;
        };

        try {
          data = (await res.json()) as typeof data;
        } catch {
          throw new Error("Invalid response while verifying payment");
        }

        if (!res.ok) {
          const mapped = mapVerifyError(res.status, data.error || data.message);
          setError(`${mapped.title}: ${mapped.message}`);
          return;
        }

        // Payment was successful on Paystack side
        if (data.success) {
          setPaymentConfirmed(true);
          clearCart();
          setError("");

          if (data.order) {
            setOrder({
              ...data.order,
              // Ensure orderNumber always present for display
              orderNumber: data.order.orderNumber || reference || "—",
            });
            setEmailSent(Boolean(data.emailSent));
            setEmailDemo(Boolean(data.emailDemo));
          } else if (reference) {
            // Minimal success card when API confirms payment without full order row
            setOrder({
              id: 0,
              orderNumber: reference,
              email: "",
              fullName: "Customer",
              total: 0,
              status: "confirmed",
              createdAt: new Date().toISOString(),
              items: [],
            });
          }
        } else {
          const mapped = mapVerifyError(400, data.message || data.error);
          setError(`${mapped.title}: ${mapped.message}`);
        }
      } catch (err) {
        const mapped = mapVerifyError(
          0,
          err instanceof Error ? err.message : "Network error while verifying payment.",
        );
        setError(`${mapped.title}: ${mapped.message}`);
      } finally {
        setLoading(false);
      }
    },
    [reference, clearCart],
  );

  useEffect(() => {
    void verifyPayment();
  }, [verifyPayment]);

  // Auto-retry a few times — webhook or Paystack verify can lag right after redirect
  useEffect(() => {
    if (order || paymentConfirmed || !reference || !error) return;
    if (retryCount >= 4) return;

    const timer = setTimeout(() => {
      setRetryCount((n) => n + 1);
      void verifyPayment({ silent: true });
    }, 2000 * (retryCount + 1));

    return () => clearTimeout(timer);
  }, [order, paymentConfirmed, reference, error, retryCount, verifyPayment]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#6B2D3C] animate-spin mx-auto mb-4" />
          <p className="text-[#6B5F54]">Verifying your payment…</p>
          <p className="text-xs text-[#6B5F54] mt-2">Please do not close this page.</p>
        </div>
      </div>
    );
  }

  if (paymentConfirmed && order) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-4xl font-semibold tracking-tight mb-2">Payment Successful!</h1>
          <p className="text-[#6B5F54]">Thank you for your order. We&apos;ve received your payment.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-sm text-[#6B5F54]">Order Number</div>
              <div className="font-mono text-lg font-medium">{order.orderNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#6B5F54]">Total Paid</div>
              <div className="text-2xl font-semibold">₦{order.total.toLocaleString()}</div>
            </div>
          </div>

          <div className="border-t border-[#EDE6D9] pt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B5F54]">Email</span>
              <span>{order.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B5F54]">Status</span>
              <span className="capitalize text-emerald-600 font-medium">{order.status}</span>
            </div>
            {order.shipping && (
              <div className="pt-3 mt-3 border-t border-[#EDE6D9]">
                <div className="text-[#6B5F54] mb-1">Delivery to</div>
                <div className="text-[#2C2522] leading-relaxed">
                  {order.shipping.fullName || order.fullName}
                  <br />
                  {order.shipping.address}
                  <br />
                  {order.shipping.city}, {order.shipping.state}
                  {order.shipping.postalCode ? ` ${order.shipping.postalCode}` : ""}
                  <br />
                  {order.shipping.country ?? "Nigeria"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thank-you coupon */}
        <div className="mb-8 rounded-2xl border border-dashed border-[#C5A46E]/60 bg-gradient-to-br from-[#FBF8F3] to-white p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C5A46E]/15 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#6B2D3C]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] tracking-[0.2em] text-[#C5A46E] font-medium mb-1">
                A THANK YOU GIFT
              </p>
              <h2 className="font-semibold text-lg tracking-tight text-[#2C2522]">
                5% off your next order
              </h2>
              <p className="text-sm text-[#6B5F54] mt-1.5 leading-relaxed">
                Use code{" "}
                <span className="font-mono font-semibold text-[#6B2D3C]">
                  {siteConfig.thankYouCoupon}
                </span>{" "}
                at checkout (min ₦15,000). We&apos;ll also include it in your confirmation email.
              </p>
              <Link
                href="/shop"
                className="inline-flex mt-3 text-sm font-medium text-[#6B2D3C] underline underline-offset-4"
              >
                Browse fabrics for next time →
              </Link>
            </div>
          </div>
        </div>

        {/* Guest → account nudge */}
        {sessionStatus !== "loading" && !session?.user && (
          <div className="mb-8 rounded-2xl border border-[#C5A46E]/40 bg-gradient-to-br from-[#FBF8F3] to-white p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#6B2D3C]/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-[#6B2D3C]" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-lg tracking-tight text-[#2C2522]">
                  Save this order &amp; track easily
                </h2>
                <p className="text-sm text-[#6B5F54] mt-1.5 leading-relaxed">
                  Create a free account with <span className="font-medium text-[#2C2522]">{order.email}</span>{" "}
                  to see delivery status, reorder fabrics, and download invoices anytime.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
                  <Link
                    href={`/signup?email=${encodeURIComponent(order.email)}&callbackUrl=${encodeURIComponent("/account/orders")}`}
                    className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm min-h-[48px]"
                  >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    Create account
                  </Link>
                  <Link
                    href={`/login?email=${encodeURIComponent(order.email)}&callbackUrl=${encodeURIComponent("/account/orders")}`}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-2xl border border-[#D4C9B8] text-sm font-medium min-h-[48px] hover:bg-white"
                  >
                    I already have an account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop" className="btn-primary px-8 py-3 flex-1 sm:flex-none justify-center text-center">
            Continue Shopping
          </Link>
          <Link
            href={session?.user ? "/account/orders" : `/login?callbackUrl=${encodeURIComponent("/account/orders")}`}
            className="px-8 py-3 border border-[#D4C9B8] rounded-2xl hover:bg-white flex-1 sm:flex-none text-center min-h-[44px] inline-flex items-center justify-center"
          >
            Track delivery
          </Link>
        </div>

        <div className="text-center text-xs text-[#6B5F54] mt-8 flex items-center justify-center gap-2">
          <Mail className="w-3.5 h-3.5" />
          {emailDemo ? (
            <span>Confirmation email logged (add RESEND_API_KEY to send real emails)</span>
          ) : emailSent ? (
            <span>A confirmation email has been sent to {order.email}</span>
          ) : (
            <span>We could not send the confirmation email — your order is still confirmed</span>
          )}
        </div>
      </div>
    );
  }

  // Error / pending / paid-but-no-order-row
  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <AlertCircle
          className={`w-12 h-12 mx-auto mb-4 ${
            paymentConfirmed ? "text-emerald-600" : "text-amber-600"
          }`}
          aria-hidden="true"
        />
        <div className="text-[#2C2522] font-semibold text-xl mb-2">
          {paymentConfirmed ? "Payment Confirmed" : "Payment verification pending"}
        </div>
        <ErrorBanner
          title={paymentConfirmed ? "Payment confirmed" : "Verification pending"}
          message={error || "We could not confirm your payment."}
          action={
            paymentConfirmed
              ? "Your payment succeeded. Contact support with your reference if details do not appear."
              : "If you were charged, do not pay again — retry verification or contact support."
          }
          className="mb-6 text-left"
        />

        {reference && (
          <p className="text-xs font-mono text-[#6B5F54] mb-6 break-all">
            Reference: {reference}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => void verifyPayment()}
            disabled={loading}
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Retrying…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Retry verification
              </>
            )}
          </button>
          <Link
            href="/contact"
            className="px-6 py-3 border border-[#D4C9B8] rounded-2xl hover:bg-white min-h-[44px] inline-flex items-center justify-center"
          >
            Contact support
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#6B2D3C] animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
