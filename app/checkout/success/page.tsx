"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import type { OrderItemJson } from "@/lib/db/schema";

interface Order {
  id: number;
  orderNumber: string;
  email: string;
  fullName: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItemJson[];
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const clearCart = useCartStore((s) => s.clearCart);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setError("No payment reference found. Return to checkout and try again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        order?: Order;
        message?: string;
        error?: string;
      };

      if (data.success && data.order) {
        setOrder(data.order);
        clearCart();
      } else {
        setError(
          data.message ||
            data.error ||
            "We could not confirm your payment yet. If you were charged, your order will be confirmed shortly.",
        );
      }
    } catch {
      setError("Network error while verifying payment. Please retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, [reference, clearCart]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

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

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="text-red-600 font-medium mb-2">Payment verification pending</div>
        <p className="text-[#6B5F54] mb-6">{error || "We could not confirm your payment."}</p>
        {reference && (
          <p className="text-xs font-mono text-[#6B5F54] mb-6">Reference: {reference}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={verifyPayment}
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3"
          >
            <RefreshCw className="w-4 h-4" />
            Retry verification
          </button>
          <Link href="/contact" className="px-6 py-3 border border-[#D4C9B8] rounded-2xl hover:bg-white">
            Contact support
          </Link>
        </div>
      </div>
    );
  }

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
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/shop" className="btn-primary px-8 py-3 flex-1 sm:flex-none justify-center text-center">
          Continue Shopping
        </Link>
        <Link
          href="/account/orders"
          className="px-8 py-3 border border-[#D4C9B8] rounded-2xl hover:bg-white flex-1 sm:flex-none text-center"
        >
          View My Orders
        </Link>
      </div>

      <p className="text-center text-xs text-[#6B5F54] mt-8">
        A confirmation email has been sent to {order.email}
      </p>
    </div>
  );
}