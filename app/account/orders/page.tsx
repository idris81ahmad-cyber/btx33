"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function OrderHistoryPage() {
  const { status } = useSession();

  if (status === 'loading') {
    return <div className="p-8 text-center">Loading your orders...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Please sign in</h1>
        <p className="text-[#6B5F54] mb-6">You need to be logged in to view your orders.</p>
        <Link href="/login" className="btn-primary inline-block px-8 py-3">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">My Orders</h1>

      <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8">
        <div className="text-center py-12">
          <p className="text-[#6B5F54] mb-4">Your order history will appear here after you make purchases.</p>
          <Link href="/shop" className="btn-primary inline-block px-6 py-2.5">
            Start Shopping
          </Link>
        </div>
      </div>

      <p className="text-xs text-center text-[#6B5F54] mt-6">
        Full order history with details coming soon.
      </p>
    </div>
  );
}
