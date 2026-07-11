"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

function CheckoutFailureContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const reason = searchParams.get("reason");

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />

      <h1 className="text-3xl font-semibold tracking-tight mb-3">Payment Unsuccessful</h1>
      <p className="text-[#6B5F54] mb-4">
        {reason
          ? decodeURIComponent(reason)
          : "Your payment could not be completed. Please try again or contact us if the issue persists."}
      </p>

      {reference && (
        <p className="text-xs font-mono text-[#6B5F54] mb-8">Reference: {reference}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/checkout" className="btn-primary px-8 py-3">
          Try Again
        </Link>
        <Link
          href="/shop"
          className="px-8 py-3 border border-[#D4C9B8] rounded-2xl hover:bg-white"
        >
          Continue Shopping
        </Link>
      </div>

      <p className="text-xs text-[#6B5F54] mt-10">
        Need help? Contact us at{" "}
        <a href="mailto:biyorashop@gmail.com" className="underline">
          biyorashop@gmail.com
        </a>
      </p>
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#6B2D3C] animate-spin" />
        </div>
      }
    >
      <CheckoutFailureContent />
    </Suspense>
  );
}