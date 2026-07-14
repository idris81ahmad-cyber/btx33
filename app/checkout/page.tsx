"use client";

import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, Loader2, Lock, Tag } from "lucide-react";
import { mapPaymentInitError, type CheckoutError } from "@/lib/checkout-errors";
import ErrorBanner from "@/components/ErrorBanner";
import { validateCoupon, type Coupon } from "@/lib/coupons";

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "address" | "city", string>>;
type CheckoutPhase = "idle" | "validating" | "initializing" | "redirecting";

const FIELD_ORDER: (keyof FieldErrors)[] = ["fullName", "email", "phone", "address", "city"];

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const { data: session, status: sessionStatus } = useSession();
  const formRef = useRef<HTMLFormElement>(null);

  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<CheckoutPhase>("idle");
  const [paymentError, setPaymentError] = useState<CheckoutError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Kano",
    postalCode: "",
  });
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      // Always pin checkout email to the signed-in account so order history matches
      setFormData((prev) => ({
        ...prev,
        email: session.user.email || prev.email,
        fullName: prev.fullName || session.user.name || "",
      }));
    }
  }, [session?.user?.email, session?.user?.name]);

  const subtotal = getTotalPrice();
  const shippingFee = 2500;

  // Re-check coupon when cart total changes
  useEffect(() => {
    if (!appliedCoupon) return;
    const result = validateCoupon(appliedCoupon.code, subtotal);
    if (!result.valid) {
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponMessage(result.message);
      return;
    }
    setDiscount(result.discount);
  }, [subtotal, appliedCoupon]);

  const total = Math.max(0, subtotal + shippingFee - discount);
  const outOfStockItems = items.filter((item) => item.inStock <= 0);
  const isBusy = phase !== "idle";

  const applyCoupon = () => {
    const result = validateCoupon(couponInput, subtotal);
    if (!result.valid) {
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponMessage(result.message);
      toast.error(result.message);
      return;
    }
    setAppliedCoupon(result.coupon);
    setDiscount(result.discount);
    setCouponMessage(`${result.coupon.label} applied (−₦${result.discount.toLocaleString()})`);
    toast.success("Coupon applied");
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponInput("");
    setCouponMessage("");
  };

  const scrollToFirstError = (errors: FieldErrors) => {
    const first = FIELD_ORDER.find((key) => errors[key]);
    if (!first) return;
    const el = formRef.current?.querySelector(`[name="${first}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  };

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
      errors.phone = "Enter a valid Nigerian phone number (at least 10 digits)";
    }
    if (!formData.address.trim()) errors.address = "Street address is required";
    if (!formData.city.trim()) errors.city = "City is required";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(errors);
    }
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setPaymentError(null);
  };

  const handlePayWithPaystack = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map((item) => item.name).join(", ");
      setPaymentError({
        code: "OUT_OF_STOCK",
        title: "Out-of-stock items in cart",
        message: `Remove these fabrics before checkout: ${names}`,
        action: "Update your cart and return here to pay.",
      });
      toast.error("Remove out-of-stock items to continue");
      return;
    }

    setPhase("validating");
    if (!validateForm()) {
      setPhase("idle");
      setPaymentError({
        code: "VALIDATION",
        title: "Shipping details incomplete",
        message: "Please fill in all required fields marked with *.",
        action: "Correct the highlighted fields and try again.",
      });
      toast.error("Please fix the highlighted fields");
      return;
    }

    setPhase("initializing");
    setPaymentError(null);
    let keepLoading = false;

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
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state,
        postalCode: formData.postalCode.trim() || undefined,
        country: "Nigeria",
      };

      // Prefer account email when logged in — history is keyed by userId + email
      const checkoutEmail =
        session?.user?.email?.trim() || formData.email.trim();

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: checkoutEmail,
          amount: total,
          metadata: {
            fullName: shipping.fullName,
            phone: shipping.phone,
            shipping,
            cartItems,
            shippingFee,
            subtotal,
            discount,
            couponCode: appliedCoupon?.code || undefined,
            userId: session?.user?.id || null,
          },
        }),
      });

      let data: { success?: boolean; authorizationUrl?: string; error?: string };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        throw new Error("Invalid response from payment server");
      }

      if (!res.ok) {
        const mapped = mapPaymentInitError(res.status, data.error);
        setPaymentError(mapped);
        toast.error(mapped.title);
        return;
      }

      if (data.success && data.authorizationUrl) {
        keepLoading = true;
        setPhase("redirecting");
        toast.success("Redirecting to secure payment…");
        window.location.href = data.authorizationUrl;
        return;
      }

      const mapped = mapPaymentInitError(500, data.error);
      setPaymentError(mapped);
      toast.error(mapped.title);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Network error. Check your connection and try again.";
      setPaymentError({
        code: "NETWORK",
        title: "Connection problem",
        message,
        action: "Check your internet connection and try again.",
      });
      toast.error("Connection problem — please try again");
    } finally {
      if (!keepLoading) {
        setPhase("idle");
      }
    }
  };

  if (!hydrated || sessionStatus === "loading") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#6B2D3C] animate-spin mx-auto mb-3" />
          <p className="text-[#6B5F54] font-medium">Preparing checkout…</p>
          <p className="text-xs text-[#6B5F54] mt-1">Loading your cart and account details</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold mb-4">Your cart is empty</h1>
        <p className="text-[#6B5F54] mb-6">Add fabrics to your cart before proceeding to checkout.</p>
        <Link href="/shop" className="btn-primary inline-block px-8 py-3">
          Browse Fabrics
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 relative">
      {phase === "redirecting" && (
        <div className="fixed inset-0 z-50 bg-[#2C2522]/70 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-xl">
            <Loader2 className="w-12 h-12 text-[#6B2D3C] animate-spin mx-auto mb-4" />
            <p className="font-semibold text-lg">Redirecting to Paystack</p>
            <p className="text-sm text-[#6B5F54] mt-2">
              Please wait — do not close this tab while we open the secure payment page.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">Checkout</h1>
        {phase === "initializing" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#6B5F54] bg-[#F8F4EC] px-3 py-1 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Starting payment…
          </span>
        )}
      </div>

      {outOfStockItems.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Some items are out of stock</p>
            <p className="mt-1">
              Remove {outOfStockItems.map((item) => item.name).join(", ")} from your cart to continue.
            </p>
            <Link href="/cart" className="inline-block mt-2 underline font-medium">
              Go to cart
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <form ref={formRef} className="bg-white rounded-2xl border border-[#D4C9B8] p-8" onSubmit={(e) => e.preventDefault()}>
            <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

            <fieldset disabled={isBusy} className="space-y-5 disabled:opacity-80">
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
                <label className="block text-sm text-[#6B5F54] mb-1.5">Street Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`input-premium w-full ${fieldErrors.address ? "border-red-400" : ""}`}
                  placeholder="15 Kantin Kwari Road, Building 4"
                  required
                />
                {fieldErrors.address && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  <label className="block text-sm text-[#6B5F54] mb-1.5">State *</label>
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
                    <option value="Rivers">Rivers</option>
                    <option value="Oyo">Oyo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#6B5F54] mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="input-premium w-full"
                    placeholder="700001"
                  />
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8 sticky top-6">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.id}-${item.selectedLength}`} className="flex justify-between text-sm">
                  <div className="pr-4">
                    <div className="font-medium line-clamp-1">{item.name}</div>
                    <div className="text-[#6B5F54] text-xs">
                      {item.selectedLength || "5 yards"} × {item.quantity}
                      {item.inStock <= 0 && (
                        <span className="text-red-600 ml-1">(out of stock)</span>
                      )}
                    </div>
                  </div>
                  <div className="font-medium whitespace-nowrap">
                    ₦{((item.salePrice || item.price) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EDE6D9] pt-4 space-y-3 text-sm">
              <div>
                <label htmlFor="coupon" className="text-xs text-[#6B5F54] mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" aria-hidden="true" /> Coupon code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-emerald-900">{appliedCoupon.code}</p>
                      <p className="text-xs text-emerald-800 truncate">{appliedCoupon.label}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      disabled={isBusy}
                      className="text-xs underline text-emerald-900 shrink-0 min-h-[40px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      id="coupon"
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponMessage("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyCoupon();
                        }
                      }}
                      disabled={isBusy}
                      placeholder="KWARI10"
                      autoComplete="off"
                      className="input-premium flex-1 rounded-xl px-3 py-2.5 text-sm min-h-[44px] uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={isBusy || !couponInput.trim()}
                      className="px-4 py-2.5 text-sm border border-[#D4C9B8] rounded-xl hover:bg-[#F8F4EC] disabled:opacity-50 min-h-[44px]"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponMessage && !appliedCoupon && (
                  <p className="text-xs text-red-600 mt-1.5" role="status">
                    {couponMessage}
                  </p>
                )}
                <p className="text-[10px] text-[#6B5F54] mt-1.5">
                  Try KWARI10, BIYORA5000, or FABRIC15 (min. order applies)
                </p>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6B5F54]">Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5F54]">Shipping (nationwide)</span>
                <span>₦{shippingFee.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ""}</span>
                  <span>−₦{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#EDE6D9] font-semibold text-base">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>

            {paymentError && (
              <ErrorBanner error={paymentError} className="mt-4" />
            )}

            <button
              type="button"
              onClick={handlePayWithPaystack}
              disabled={isBusy || outOfStockItems.length > 0}
              className="btn-primary w-full mt-6 py-4 text-lg disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {phase === "redirecting" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Opening Paystack…
                </>
              ) : phase === "initializing" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initializing payment…
                </>
              ) : phase === "validating" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking details…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ₦{total.toLocaleString()} with Paystack
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