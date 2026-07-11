"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "address" | "city", string>>;

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "Kano",
  });

  const subtotal = getTotalPrice();
  const shippingFee = 2500;
  const total = subtotal + shippingFee;

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Enter a valid phone number";
    }
    if (!formData.address.trim()) errors.address = "Delivery address is required";
    if (!formData.city.trim()) errors.city = "City is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setPaymentError("");
  };

  const handlePayWithPaystack = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setLoading(true);
    setPaymentError("");

    try {
      const cartItems = items.map((item) => ({
        productId: item.id,
        name: item.name,
        slug: item.slug,
        category: item.category,
        image: item.images?.[0] || "",
        selectedLength: item.selectedLength || "5 yards",
        quantity: item.quantity,
        unitPrice: item.salePrice || item.price,
        lineTotal: (item.salePrice || item.price) * item.quantity,
      }));

      const shipping = {
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state,
      };

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          amount: total,
          metadata: {
            fullName: formData.fullName.trim(),
            phone: formData.phone.trim(),
            shipping,
            cartItems,
            shippingFee,
            subtotal,
            discount: 0,
            userId: session?.user?.id || null,
          },
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        authorizationUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        const message =
          data.error ||
          (res.status === 503
            ? "Online payments are temporarily unavailable. Please try again later or contact us."
            : "Failed to initialize payment");
        setPaymentError(message);
        toast.error(message);
        return;
      }

      if (data.success && data.authorizationUrl) {
        toast.success("Redirecting to secure payment…");
        window.location.href = data.authorizationUrl;
        return;
      }

      const message = data.error || "Failed to initialize payment";
      setPaymentError(message);
      toast.error(message);
    } catch {
      const message = "Network error. Check your connection and try again.";
      setPaymentError(message);
      toast.error(message);
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
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8">
            <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

            <fieldset disabled={loading} className="space-y-5 disabled:opacity-80">
              <div>
                <label className="block text-sm text-[#6B5F54] mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`input-premium w-full ${fieldErrors.fullName ? "border-red-400" : ""}`}
                  placeholder="Amina Yusuf"
                  required
                />
                {fieldErrors.fullName && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-[#6B5F54] mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-premium w-full ${fieldErrors.email ? "border-red-400" : ""}`}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-[#6B5F54] mb-1.5">Phone Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`input-premium w-full ${fieldErrors.phone ? "border-red-400" : ""}`}
                    placeholder="+234 906 181 1134"
                    required
                  />
                  {fieldErrors.phone && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#6B5F54] mb-1.5">Delivery Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`input-premium w-full ${fieldErrors.address ? "border-red-400" : ""}`}
                  placeholder="15 Kantin Kwari Road"
                  required
                />
                {fieldErrors.address && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-[#6B5F54] mb-1.5">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`input-premium w-full ${fieldErrors.city ? "border-red-400" : ""}`}
                    placeholder="Kano"
                    required
                  />
                  {fieldErrors.city && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.city}</p>
                  )}
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
            </fieldset>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8 sticky top-6">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="pr-4">
                    <div className="font-medium line-clamp-1">{item.name}</div>
                    <div className="text-[#6B5F54] text-xs">
                      {item.selectedLength || "5 yards"} × {item.quantity}
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

            {paymentError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {paymentError}
              </div>
            )}

            <button
              onClick={handlePayWithPaystack}
              disabled={loading}
              className="btn-primary w-full mt-6 py-4 text-lg disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecting to Paystack…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay with Paystack
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#6B5F54] mt-4">
              Secure payment powered by Paystack. You will be redirected to complete payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}