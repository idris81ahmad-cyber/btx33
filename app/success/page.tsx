"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, Suspense } from "react";
import confetti from "canvas-confetti";

function SuccessContent() {
  const searchParams = useSearchParams();
  
  const orderNumber = searchParams.get("order") || "BTX3-00000000";
  const total = searchParams.get("total") || "0";

  useEffect(() => {
    const duration = 2200;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 80,
        origin: { x: 0.1, y: 0.8 },
        colors: ["#C5A46E", "#6B2D3C", "#1E3A2F"]
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 80,
        origin: { x: 0.9, y: 0.8 },
        colors: ["#C5A46E", "#6B2D3C", "#1E3A2F"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.7 }
      });
    }, 450);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-11 h-11 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </div>

      <div className="text-emerald-600 text-xs tracking-[4px] mb-3">ORDER CONFIRMED</div>
      
      <h1 className="text-6xl tracking-[-2.2px] font-semibold mb-4">Thank You!</h1>
      <p className="text-2xl text-[#4A4038]">Your order has been placed successfully.</p>

      <div className="my-10 inline-block bg-white border border-[#D4C9B8] rounded-3xl px-10 py-6">
        <div className="text-xs tracking-[2px] text-[#6B5F54]">ORDER NUMBER</div>
        <div className="font-mono text-4xl tracking-[1px] font-semibold text-[#6B2D3C] mt-1">{orderNumber}</div>
        <div className="mt-3 text-sm">Total paid: <span className="font-mono font-semibold">₦{parseInt(total).toLocaleString()}</span></div>
      </div>

      <div className="max-w-sm mx-auto text-[#6B5F54] text-[15px] leading-relaxed mb-10">
        You will receive a confirmation email shortly with your order details and tracking information. 
        Our team will contact you within 24 hours to confirm delivery timeline.
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/shop" className="btn-primary px-9 py-4 rounded-2xl inline-flex items-center justify-center text-lg">
          Continue Shopping
        </Link>
        <button 
          onClick={() => alert("Tracking demo: Your order is being prepared at our Kano warehouse. ETA: 3-5 business days.")}
          className="px-9 py-4 rounded-2xl border border-[#D4C9B8] hover:bg-white text-lg font-medium"
        >
          Track Your Order
        </button>
      </div>

      <p className="mt-12 text-xs text-[#6B5F54]">Questions? Reach us on WhatsApp at <span className="font-medium">+234 809 123 4567</span></p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-16 text-center">Loading order confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  );
}