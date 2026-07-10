"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  email: string;
  fullName: string;
  total: number;
  status: string;
  createdAt: string;
  items: any[];
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setError('No payment reference found');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });

        const data = await res.json();

        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.message || 'Failed to verify payment');
        }
      } catch {
        setError('Something went wrong while verifying your payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B2D3C] mx-auto mb-4"></div>
          <p className="text-[#6B5F54]">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="text-red-500 mb-4">Payment verification failed</div>
        <p className="text-[#6B5F54] mb-6">{error || 'We could not confirm your payment.'}</p>
        <Link href="/shop" className="btn-primary inline-block px-8 py-3">
          Continue Shopping
        </Link>
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
        <Link 
          href="/shop" 
          className="btn-primary px-8 py-3 flex-1 sm:flex-none justify-center"
        >
          Continue Shopping
        </Link>
        <Link 
          href="/account/orders" 
          className="px-8 py-3 border border-[#D4C9B8] rounded-2xl hover:bg-white flex-1 sm:flex-none justify-center"
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
