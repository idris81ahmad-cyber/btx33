"use client";

import { useEffect, useMemo, useState } from "react";
import ProductImage from "@/components/ProductImage";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { validateCoupon } from "@/lib/coupons";
import { estimateShipping } from "@/lib/shipping";
import { productImageAlt } from "@/lib/image-blur";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tag, Truck } from "lucide-react";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

const checkoutSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(10, "Please enter your full delivery address"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "Please select a state"),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["card", "transfer", "payondelivery"]),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const STEPS = ["Contact", "Shipping", "Payment", "Review"];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [mounted, setMounted] = useState(false);

  const subtotal = getTotalPrice();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "card", state: "FCT - Abuja" },
  });

  const fullName = watch("fullName");
  const email = watch("email");
  const phone = watch("phone");
  const address = watch("address");
  const city = watch("city");
  const state = watch("state");
  const paymentMethod = watch("paymentMethod");

  useEffect(() => setMounted(true), []);

  const shipping = useMemo(() => estimateShipping(state || "FCT - Abuja", subtotal), [state, subtotal]);
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal + shipping.fee - discount);

  const completedSteps = useMemo(() => {
    let count = 0;
    if (fullName && email && phone) count = 1;
    if (count >= 1 && address && city && state) count = 2;
    if (count >= 2 && paymentMethod) count = 3;
    return count;
  }, [fullName, email, phone, address, city, state, paymentMethod]);

  useEffect(() => {
    if (mounted && items.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, items.length, router]);

  if (!mounted || items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B2D3C]" />
      </div>
    );
  }

  const applyCoupon = () => {
    const result = validateCoupon(couponInput, subtotal);
    if (!result.valid) {
      setCouponError(result.message);
      setAppliedCoupon(null);
      return;
    }
    setCouponError("");
    setAppliedCoupon({ code: result.coupon.code, discount: result.discount, label: result.coupon.label });
    toast.success("Coupon applied", { description: result.coupon.label });
  };

  const onSubmit = async (_data: CheckoutForm) => {
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1650));
      const orderNumber = "BIYORA-" + Date.now().toString().slice(-8);
      clearCart();
      try {
        const confettiModule = await import("canvas-confetti");
        confettiModule.default({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
      } catch {}
      toast.success("Order placed successfully!", {
        description: `Order #${orderNumber} confirmed. Thank you for shopping with BIYORA SHOP.`,
      });
      router.push(`/success?order=${orderNumber}&total=${total}&shipping=${shipping.fee}&discount=${discount}`);
    } catch {
      toast.error("Order failed", { description: "Please try again or contact support." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-xs tracking-[3px] text-[#C5A46E]">SECURE CHECKOUT</div>
        <h1 className="text-5xl tracking-[-1.8px] font-semibold">Complete Your Order</h1>
      </div>

      {/* Progress indicator */}
      <div className="mb-10 flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition ${
              i <= completedSteps ? "bg-[#6B2D3C] text-white" : "bg-[#EDE4D4] text-[#6B5F54]"
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i <= completedSteps ? "text-[#2C2522] font-medium" : "text-[#6B5F54]"}`}>{step}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-[#D4C9B8] mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-x-10 gap-y-10">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card className="rounded-3xl border-[#D4C9B8]">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-xs tracking-widest text-[#6B5F54]">FULL NAME</Label>
                  <Input {...register("fullName")} className="mt-1.5 rounded-2xl" placeholder="Chidinma Okoro" />
                  {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <Label className="text-xs tracking-widest text-[#6B5F54]">EMAIL ADDRESS</Label>
                  <Input {...register("email")} type="email" className="mt-1.5 rounded-2xl" placeholder="you@email.com" />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs tracking-widest text-[#6B5F54]">PHONE (WhatsApp preferred)</Label>
                  <Input {...register("phone")} className="mt-1.5 rounded-2xl" placeholder="+234 803 123 4567" />
                  {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-[#D4C9B8]">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-xs tracking-widest text-[#6B5F54]">STREET ADDRESS</Label>
                  <Input {...register("address")} className="mt-1.5 rounded-2xl" placeholder="15A Aminu Kano Crescent, Wuse 2" />
                  {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <Label className="text-xs tracking-widest text-[#6B5F54]">CITY</Label>
                    <Input {...register("city")} className="mt-1.5 rounded-2xl" placeholder="Abuja" />
                    {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs tracking-widest text-[#6B5F54]">STATE</Label>
                    <select {...register("state")} className="input-premium w-full rounded-2xl px-4 py-2.5 mt-1.5 text-sm">
                      {nigerianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs tracking-widest text-[#6B5F54]">POSTAL CODE</Label>
                    <Input {...register("postalCode")} className="mt-1.5 rounded-2xl" placeholder="900001" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs tracking-widest text-[#6B5F54]">DELIVERY NOTES</Label>
                  <textarea {...register("notes")} rows={3} className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5 resize-y text-sm" placeholder="Gate code, landmarks..." />
                </div>
                <div className="p-4 bg-[#F8F4EC] rounded-2xl text-sm flex items-center justify-between">
                  <span className="text-[#6B5F54]">{shipping.label} — {shipping.eta}</span>
                  <Badge variant="secondary">{shipping.fee === 0 ? "FREE" : `₦${shipping.fee.toLocaleString()}`}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-[#D4C9B8]">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { value: "card", label: "Credit / Debit Card (Paystack)", desc: "Instant & secure" },
                  { value: "transfer", label: "Bank Transfer", desc: "Pay to our corporate account" },
                  { value: "payondelivery", label: "Pay on Delivery", desc: "Cash or POS on receipt (Nigeria only)" },
                ].map((method) => (
                  <label key={method.value} className="flex items-start gap-4 border border-[#D4C9B8] rounded-2xl p-5 cursor-pointer has-[:checked]:border-[#6B2D3C] has-[:checked]:bg-[#F8F4EC]">
                    <input type="radio" value={method.value} {...register("paymentMethod")} className="mt-1 accent-[#6B2D3C]" />
                    <div>
                      <div className="font-medium">{method.label}</div>
                      <div className="text-sm text-[#6B5F54]">{method.desc}</div>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Button type="submit" disabled={isProcessing} size="lg" className="w-full py-6 text-lg rounded-2xl bg-[#6B2D3C] hover:bg-[#4A1F2A]">
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> PROCESSING...</>
              ) : (
                `PLACE ORDER — ₦${total.toLocaleString()}`
              )}
            </Button>
            <p className="text-center text-xs text-[#6B5F54]">By placing this order you agree to our Terms and Shipping Policy.</p>
          </form>
        </div>

        <div className="lg:col-span-5">
          <Card className="rounded-3xl border-[#D4C9B8] sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 mb-6 text-sm">
                {items.map((item) => (
                  <div key={`${item.id}-${item.selectedLength}`} className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0">
                      <ProductImage src={item.images[0]} alt={productImageAlt(item.name, item.category)} fill sizes="64px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight">{item.name}</div>
                      <div className="text-xs text-[#6B5F54]">{item.selectedLength} × {item.quantity}</div>
                    </div>
                    <div className="font-mono whitespace-nowrap">₦{(item.currentPrice * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-6 p-4 bg-[#F8F4EC] rounded-2xl">
                <div className="flex items-center gap-2 text-xs tracking-widest text-[#6B5F54] mb-2">
                  <Tag className="w-3.5 h-3.5" /> COUPON CODE
                </div>
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. KWARI10"
                    className="rounded-xl uppercase"
                  />
                  <Button type="button" variant="outline" onClick={applyCoupon} className="shrink-0 rounded-xl">Apply</Button>
                </div>
                {couponError && <p className="text-red-600 text-xs mt-1">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-emerald-700 text-xs mt-1">{appliedCoupon.label} (−₦{appliedCoupon.discount.toLocaleString()})</p>
                )}
                <p className="text-[10px] text-[#6B5F54] mt-2">Try KWARI10, BIYORA5000, or FABRIC15</p>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">₦{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-[#6B5F54]">
                  <span>Shipping ({shipping.label})</span>
                  <span className="font-mono">{shipping.fee === 0 ? "Free" : `₦${shipping.fee.toLocaleString()}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="font-mono">−₦{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B5F54]"><span>Tax</span><span>Included</span></div>
              </div>

              <div className="border-t mt-4 pt-4 flex justify-between text-2xl font-semibold">
                <span>Total</span>
                <span className="font-mono tabular-nums">₦{total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}