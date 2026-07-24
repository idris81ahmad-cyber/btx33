"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Loader2,
  Lock,
  MapPin,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { mapPaymentInitError, type CheckoutError } from "@/lib/checkout-errors";
import ErrorBanner from "@/components/ErrorBanner";
import CouponPanel from "@/components/CouponPanel";
import StockBadge from "@/components/StockBadge";
import { validateCoupon, type Coupon } from "@/lib/coupons";
import {
  CHECKOUT_STATES,
  DELIVERY_WINDOWS_BLURB,
  estimateShipping,
  getShippingFee,
} from "@/lib/shipping";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<
  Record<"fullName" | "email" | "phone" | "address" | "city", string>
>;
type CheckoutPhase = "idle" | "validating" | "initializing" | "redirecting";
type StepId = "contact" | "address" | "payment";

type SavedAddress = {
  id: number;
  label?: string | null;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string | null;
  isDefault?: boolean | null;
};

const STEPS: { id: StepId; label: string; icon: typeof User }[] = [
  { id: "contact", label: "Contact", icon: User },
  { id: "address", label: "Delivery", icon: MapPin },
  { id: "payment", label: "Payment", icon: Lock },
];

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const { data: session, status: sessionStatus } = useSession();
  const formRef = useRef<HTMLFormElement>(null);

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<StepId>("contact");
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const isGuest = !session?.user;
  const shippingFee = getShippingFee();
  const subtotal = getTotalPrice();
  const total = Math.max(0, subtotal + shippingFee - discount);
  const outOfStockItems = items.filter((item) => item.inStock <= 0);
  const isBusy = phase !== "idle";
  const shipEstimate = useMemo(
    () => estimateShipping(formData.state, subtotal),
    [formData.state, subtotal],
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: session.user.email || prev.email,
        fullName: prev.fullName || session.user.name || "",
      }));
    }
  }, [session?.user?.email, session?.user?.name]);

  // Load saved addresses for logged-in customers
  useEffect(() => {
    if (sessionStatus !== "authenticated" || session?.user?.role === "admin") return;
    fetch("/api/account/addresses", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list: SavedAddress[] = Array.isArray(d.addresses) ? d.addresses : [];
        setSavedAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) applySavedAddress(def, false);
      })
      .catch(() => setSavedAddresses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, session?.user?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    const code = new URLSearchParams(window.location.search).get("coupon");
    if (!code) return;
    const normalized = code.trim().toUpperCase();
    setCouponInput(normalized);
    const result = validateCoupon(normalized, subtotal);
    if (result.valid) {
      setAppliedCoupon(result.coupon);
      setDiscount(result.discount);
      setCouponMessage(`${result.coupon.label} applied`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

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

  const applySavedAddress = (addr: SavedAddress, toastIt = true) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName || prev.fullName,
      phone: addr.phone || prev.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state || prev.state,
      postalCode: addr.postalCode || "",
    }));
    if (toastIt) toast.success("Address applied");
  };

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
    toast.success("Coupon applied — you save ₦" + result.discount.toLocaleString());
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponInput("");
    setCouponMessage("");
    toast.message("Coupon removed");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setPaymentError(null);
    if (["address", "city", "state", "postalCode"].includes(name)) {
      setSelectedAddressId(null);
    }
  };

  const validateContact = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Enter a valid email";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Enter a valid phone (10+ digits)";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAddress = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.address.trim()) errors.address = "Street address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (step === "contact") {
      if (!validateContact()) {
        toast.error("Please complete your contact details");
        return;
      }
      setStep("address");
      return;
    }
    if (step === "address") {
      if (!validateContact() || !validateAddress()) {
        toast.error("Please complete delivery details");
        return;
      }
      setStep("payment");
    }
  };

  const handlePayWithPaystack = async (opts?: { express?: boolean }) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (outOfStockItems.length > 0) {
      toast.error("Remove out-of-stock items to continue");
      return;
    }

    setPhase("validating");
    if (!validateContact() || !validateAddress()) {
      setPhase("idle");
      setStep(!formData.fullName || !formData.email || !formData.phone ? "contact" : "address");
      setPaymentError({
        code: "VALIDATION",
        title: "Details incomplete",
        message: "Please fill required fields before payment.",
        action: "Complete contact and delivery, then try again.",
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
            express: Boolean(opts?.express),
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
        err instanceof Error ? err.message : "Network error. Check your connection.";
      setPaymentError({
        code: "NETWORK",
        title: "Connection problem",
        message,
        action: "Check your internet connection and try again.",
      });
      toast.error("Connection problem — please try again");
    } finally {
      if (!keepLoading) setPhase("idle");
    }
  };

  const expressReady =
    Boolean(session?.user) &&
    savedAddresses.length > 0 &&
    formData.address.trim() &&
    formData.phone.trim() &&
    formData.fullName.trim();

  if (!hydrated || sessionStatus === "loading") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#6B2D3C] animate-spin mx-auto mb-3" />
          <p className="text-[#6B5F54] font-medium">Preparing checkout…</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold mb-4">Your cart is empty</h1>
        <p className="text-[#6B5F54] mb-6">Add fabrics before checkout.</p>
        <Link href="/shop" className="btn-primary inline-block px-8 py-3">
          Browse Fabrics
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 sm:py-12 relative">
      {phase === "redirecting" && (
        <div className="fixed inset-0 z-50 bg-[#2C2522]/70 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-xl">
            <Loader2 className="w-12 h-12 text-[#6B2D3C] animate-spin mx-auto mb-4" />
            <p className="font-semibold text-lg">Redirecting to Paystack</p>
            <p className="text-sm text-[#6B5F54] mt-2">
              Please wait — do not close this tab.
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-sm text-[#6B5F54] mt-2 flex items-start gap-2">
          <Truck className="w-4 h-4 mt-0.5 shrink-0 text-[#C5A46E]" aria-hidden="true" />
          <span>
            Estimated delivery — {DELIVERY_WINDOWS_BLURB}
            {subtotal >= 75_000 ? " · Free shipping on this order" : ""}
          </span>
        </p>
        {isGuest && (
          <p className="text-xs text-[#6B5F54] mt-2">
            Guest checkout is welcome.{" "}
            <Link href="/login?callbackUrl=/checkout" className="text-[#6B2D3C] underline">
              Sign in
            </Link>{" "}
            for saved addresses & order history — or create an account after you pay.
          </p>
        )}
      </div>

      {/* Step indicator */}
      <nav aria-label="Checkout steps" className="mb-8">
        <ol className="flex flex-wrap gap-2 sm:gap-3">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done =
              (s.id === "contact" && (step === "address" || step === "payment")) ||
              (s.id === "address" && step === "payment");
            const Icon = s.icon;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (done || active) setStep(s.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border min-h-[40px] transition",
                    active && "bg-[#6B2D3C] text-white border-[#6B2D3C]",
                    done && !active && "bg-emerald-50 text-emerald-900 border-emerald-200",
                    !active && !done && "bg-white text-[#6B5F54] border-[#E8DFD0]",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done && !active ? (
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">{i + 1}. </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {outOfStockItems.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Some items are unavailable</p>
            <p className="mt-1">
              Remove {outOfStockItems.map((item) => item.name).join(", ")} to continue.
            </p>
            <Link href="/cart" className="inline-block mt-2 underline font-medium">
              Go to cart
            </Link>
          </div>
        </div>
      )}

      {paymentError && (
        <ErrorBanner
          title={paymentError.title}
          message={paymentError.message}
          action={paymentError.action}
          className="mb-6"
        />
      )}

      {/* Express checkout */}
      {expressReady && step !== "payment" && (
        <div className="mb-6 rounded-2xl border border-[#C5A46E]/40 bg-gradient-to-r from-[#FBF8F3] to-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6B2D3C]/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-[#6B2D3C]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#2C2522]">Express checkout</p>
              <p className="text-xs text-[#6B5F54] mt-0.5">
                Pay with your saved address
                {selectedAddressId
                  ? ` · ${formData.city}, ${formData.state}`
                  : ""}{" "}
                — ₦{total.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isBusy || outOfStockItems.length > 0}
            onClick={() => void handlePayWithPaystack({ express: true })}
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm min-h-[48px] disabled:opacity-60"
          >
            {phase === "initializing" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Buy now
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <form
            ref={formRef}
            className="bg-white rounded-2xl border border-[#D4C9B8] p-6 sm:p-8"
            onSubmit={(e) => e.preventDefault()}
          >
            <fieldset disabled={isBusy} className="space-y-5 disabled:opacity-80">
              {/* STEP: CONTACT */}
              {step === "contact" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">Your details</h2>
                    <p className="text-sm text-[#6B5F54] mt-1">
                      {isGuest
                        ? "No account needed — we only use this for delivery & order updates."
                        : "Using your account email so order history stays linked."}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B5F54] mb-1.5">Full name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`input-premium w-full ${fieldErrors.fullName ? "border-red-400" : ""}`}
                      placeholder="Amina Yusuf"
                      autoComplete="name"
                    />
                    {fieldErrors.fullName && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-[#6B5F54] mb-1.5">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        readOnly={Boolean(session?.user?.email)}
                        className={`input-premium w-full ${fieldErrors.email ? "border-red-400" : ""} ${session?.user?.email ? "bg-[#F8F4EC]" : ""}`}
                        autoComplete="email"
                      />
                      {fieldErrors.email && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-[#6B5F54] mb-1.5">
                        WhatsApp phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`input-premium w-full ${fieldErrors.phone ? "border-red-400" : ""}`}
                        placeholder="+234 906 181 1134"
                        autoComplete="tel"
                      />
                      {fieldErrors.phone && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={goNext}
                    className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl min-h-[48px]"
                  >
                    Continue to delivery
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP: ADDRESS */}
              {step === "address" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">Delivery address</h2>
                    <p className="text-sm text-[#6B5F54] mt-1">
                      Where should we send your fabrics?
                    </p>
                  </div>

                  {savedAddresses.length > 0 && (
                    <div>
                      <p className="text-xs tracking-wide text-[#C5A46E] font-medium mb-2">
                        SAVED ADDRESSES
                      </p>
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => applySavedAddress(addr)}
                            className={cn(
                              "w-full text-left rounded-2xl border px-4 py-3 text-sm transition min-h-[48px]",
                              selectedAddressId === addr.id
                                ? "border-[#6B2D3C] bg-[#6B2D3C]/5"
                                : "border-[#E8DFD0] hover:border-[#C5A46E]/50",
                            )}
                          >
                            <span className="font-medium">{addr.label || "Address"}</span>
                            <span className="block text-xs text-[#6B5F54] mt-0.5">
                              {addr.address}, {addr.city}, {addr.state}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-[#6B5F54] mb-1.5">Street address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`input-premium w-full ${fieldErrors.address ? "border-red-400" : ""}`}
                      placeholder="15 Kantin Kwari Road"
                      autoComplete="street-address"
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
                        autoComplete="address-level2"
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
                        {CHECKOUT_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#6B5F54] mb-1.5">Postal code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="input-premium w-full"
                        autoComplete="postal-code"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E8DFD0] bg-[#FBF8F3] px-4 py-3.5 flex gap-3">
                    <Truck className="w-5 h-5 text-[#6B2D3C] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[#2C2522]">
                        Est. delivery to {formData.state}
                      </p>
                      <p className="text-sm text-[#6B5F54] mt-0.5">
                        {shipEstimate.eta} · {shipEstimate.label}
                      </p>
                      <p className="text-xs text-[#8A7E72] mt-1">{DELIVERY_WINDOWS_BLURB}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("contact")}
                      className="px-6 py-3 rounded-2xl border border-[#D4C9B8] text-sm font-medium min-h-[48px]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="btn-primary flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl min-h-[48px]"
                    >
                      Continue to payment
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: PAYMENT */}
              {step === "payment" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">Review & pay</h2>
                    <p className="text-sm text-[#6B5F54] mt-1">
                      Confirm details, then pay securely with Paystack.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E8DFD0] bg-[#FBF8F3] p-4 text-sm space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-[#6B5F54]">Contact</span>
                      <span className="text-right font-medium">
                        {formData.fullName}
                        <br />
                        <span className="text-xs font-normal text-[#6B5F54]">
                          {formData.email} · {formData.phone}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 pt-2 border-t border-[#E8DFD0]">
                      <span className="text-[#6B5F54]">Deliver to</span>
                      <span className="text-right font-medium max-w-[60%]">
                        {formData.address}, {formData.city}, {formData.state}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 pt-2 border-t border-[#E8DFD0]">
                      <span className="text-[#6B5F54]">Delivery window</span>
                      <span className="font-medium text-right">{shipEstimate.eta}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep("address")}
                      className="text-xs text-[#6B2D3C] underline mt-1"
                    >
                      Edit delivery
                    </button>
                  </div>

                  <CouponPanel
                    idPrefix="checkout-coupon"
                    couponInput={couponInput}
                    onInputChange={setCouponInput}
                    appliedCoupon={appliedCoupon}
                    discount={discount}
                    couponMessage={couponMessage}
                    onApply={applyCoupon}
                    onRemove={removeCoupon}
                    disabled={isBusy}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("address")}
                      className="px-6 py-3 rounded-2xl border border-[#D4C9B8] text-sm font-medium min-h-[48px]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePayWithPaystack()}
                      disabled={isBusy || outOfStockItems.length > 0}
                      className="btn-primary flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl min-h-[48px] disabled:opacity-60"
                    >
                      {phase === "initializing" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting payment…
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Pay ₦{total.toLocaleString()} securely
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8A7E72] flex items-center gap-1.5">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Card & transfer via Paystack. We never store your card details.
                  </p>
                </div>
              )}
            </fieldset>
          </form>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#D4C9B8] p-6 sm:p-8 sticky top-6">
            <h2 className="text-xl font-semibold mb-5">Order summary</h2>
            <div className="space-y-4 mb-6 max-h-56 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.selectedLength}`}
                  className="flex justify-between text-sm gap-3"
                >
                  <div className="pr-2 min-w-0">
                    <div className="font-medium line-clamp-1">{item.name}</div>
                    <div className="text-[#6B5F54] text-xs flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>
                        {item.selectedLength || "5 yards"} × {item.quantity}
                      </span>
                      <StockBadge inStock={item.inStock} />
                    </div>
                  </div>
                  <div className="font-medium whitespace-nowrap shrink-0">
                    ₦{((item.salePrice || item.price) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EDE6D9] pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#6B5F54]">
                <span>Subtotal</span>
                <span className="tabular-nums">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#6B5F54]">
                <span>Shipping</span>
                <span className="tabular-nums">₦{shippingFee.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Coupon savings</span>
                  <span className="tabular-nums">−₦{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-[#EDE6D9]">
                <span>Total</span>
                <span className="tabular-nums">₦{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-[#F8F4EC] px-3 py-2.5 text-xs text-[#6B5F54]">
              <span className="font-medium text-[#2C2522]">Delivery: </span>
              {shipEstimate.windowSummary}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
