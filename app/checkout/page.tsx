"use client";

import { useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: 'Kano',
  });

  const subtotal = getTotalPrice();
  const shippingFee = 2500; // Fixed shipping for now
  const total = subtotal + shippingFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayWithPaystack = async () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Prepare cart items for metadata
      const cartItems = items.map(item => ({
        productId: item.id,
        name: item.name,
        slug: item.slug,
        category: item.category,
        image: item.images?.[0] || '',
        selectedLength: item.selectedLength || '5 yards',
        quantity: item.quantity,
        unitPrice: item.salePrice || item.price,
        lineTotal: (item.salePrice || item.price) * item.quantity,
      }));

      const shipping = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
      };

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          amount: total,
          metadata: {
            fullName: formData.fullName,
            phone: formData.phone,
            shipping,
            cartItems,
            shippingFee,
            userId: session?.user?.id || null,
          },
        }),
      });

      const data = await res.json();

      if (data.success && data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold mb-4">Your cart is empty</h1>
        <Link href="/shop" className="btn-primary inline-block px-8 py-3">
          Browse Fabrics
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8">
            <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-[#6B5F54] mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="input-premium w-full"
                  placeholder="Amina Yusuf"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-[#6B5F54] mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-premium w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6B5F54] mb-1.5">Phone Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-premium w-full"
                    placeholder="+234 906 181 1134"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#6B5F54] mb-1.5">Delivery Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input-premium w-full"
                  placeholder="15 Kantin Kwari Road"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-[#6B5F54] mb-1.5">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-premium w-full"
                    placeholder="Kano"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6B5F54] mb-1.5">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input-premium w-full"
                  >
                    <option value="Kano">Kano</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Kaduna">Kaduna</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8 sticky top-6">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="pr-4">
                    <div className="font-medium line-clamp-1">{item.name}</div>
                    <div className="text-[#6B5F54] text-xs">
                      {item.selectedLength || '5 yards'} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-medium whitespace-nowrap">
                    ₦{((item.salePrice || item.price) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EDE6D9] pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B5F54]">Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5F54]">Shipping</span>
                <span>₦{shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#EDE6D9] font-semibold text-base">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePayWithPaystack}
              disabled={loading}
              className="btn-primary w-full mt-8 py-4 text-lg disabled:opacity-70"
            >
              {loading ? 'Processing...' : 'Pay with Paystack'}
            </button>

            <p className="text-center text-xs text-[#6B5F54] mt-4">
              Secure payment powered by Paystack
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
