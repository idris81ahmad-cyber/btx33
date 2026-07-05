"use client";

import { useState } from "react";
import ProductImage from "@/components/ProductImage";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const total = getTotalPrice();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "card",
      state: "FCT - Abuja",
    },
  });

  const paymentMethod = watch("paymentMethod");

  // Client-side only redirect
  if (typeof window !== "undefined" && items.length === 0) {
    router.push("/cart");
    return null;
  }

  const onSubmit = async (_data: CheckoutForm) => {
    setIsProcessing(true);
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
    router.push(`/success?order=${orderNumber}&total=${total}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-xs tracking-[3px] text-[#C5A46E]">SECURE CHECKOUT</div>
        <h1 className="text-5xl tracking-[-1.8px] font-semibold">Complete Your Order</h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-x-10 gap-y-10">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-white border border-[#D4C9B8] rounded-3xl p-8">
              <div className="font-semibold text-xl mb-6 tracking-tight">Contact Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs tracking-widest text-[#6B5F54] block mb-1.5">FULL NAME</label>
                  <input {...register("fullName")} className="input-premium w-full rounded-2xl px-5 py-3.5" placeholder="Chidinma Okoro" />
                  {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="text-xs tracking-widest text-[#6B5F54] block mb-1.5">EMAIL ADDRESS</label>
                  <input {...register("email")} type="email" className="input-premium w-full rounded-2xl px-5 py-3.5" placeholder="you@email.com" />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs tracking-widest text-[#6B5F54] block mb-1.5">PHONE NUMBER (WhatsApp preferred)</label>
                  <input {...register("phone")} className="input-premium w-full rounded-2xl px-5 py-3.5" placeholder="+234 803 123 4567" />
                  {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#D4C9B8] rounded-3xl p-8">
              <div className="font-semibold text-xl mb-6 tracking-tight">Shipping Address</div>
              <div className="space-y-5">
                <div>
                  <label className="text-xs tracking-widest text-[#6B5F54] block mb-1.5">STREET ADDRESS</label>
                  <input {...register("address")} className="input-premium w-full rounded-2xl px-5 py-3.5" placeholder="15A Aminu Kano Crescent, Wuse 2" />
                  {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs tracking-widest text-[#6B5F54] block mb-1.5">CITY / TOWN</label>
                    <input {...register("city")} className="input-premium w-full rounded-2xl px-5 py-3.5" placeholder="Abuja" />
                    {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs tracking-widest text-[#6B5F54] block mb-1.5">STATE</label>
                    <select {...register("state")} className="input-premium w-full rounded-2xl px-5 py-3.5">
                      {nigerianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs tracking-widest text-[#6B5F54] block mb-1.5">POSTAL CODE (Optional)</label>
                    <input {...register("postalCode")} className="input-premium w-full rounded-2xl px-5 py-3.5" placeholder="900001" />
                  </div>
                </div>

                <div>
                  <label className="text-xs tracking-widest text-[#6B5F54] block mb-1.5">DELIVERY NOTES (Optional)</label>
                  <textarea {...register("notes")} rows={3} className="input-premium w-full rounded-2xl px-5 py-3.5 resize-y" placeholder="Please call upon arrival. Gate code: 4451" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#D4C9B8] rounded-3xl p-8">
              <div className="font-semibold text-xl mb-6 tracking-tight">Payment Method</div>
              <div className="space-y-3">
                {[
                  { value: "card", label: "Credit / Debit Card (Paystack)", desc: "Instant & secure" },
                  { value: "transfer", label: "Bank Transfer", desc: "Pay to our corporate account" },
                  { value: "payondelivery", label: "Pay on Delivery", desc: "Cash or POS on receipt (Nigeria only)" },
                ].map((method) => (
                  <label key={method.value} className="flex items-start gap-4 border border-[#D4C9B8] rounded-2xl p-5 cursor-pointer has-[:checked]:border-[#6B2D3C] has-[:checked]:bg-[#F8F4EC]">
                    <input 
                      type="radio" 
                      value={method.value} 
                      {...register("paymentMethod")} 
                      className="mt-1 accent-[#6B2D3C]" 
                    />
                    <div>
                      <div className="font-medium">{method.label}</div>
                      <div className="text-sm text-[#6B5F54]">{method.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === "card" && (
                <div className="mt-5 p-5 bg-[#F8F4EC] rounded-2xl text-xs text-[#6B5F54]">
                  Your payment is securely processed via Paystack. We never store your card details.
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className="btn-primary w-full py-5 text-xl rounded-2xl font-medium disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {isProcessing ? "PROCESSING YOUR ORDER..." : `PLACE ORDER — ₦${total.toLocaleString()}`}
            </button>
            
            <p className="text-center text-xs text-[#6B5F54]">By placing this order you agree to our Terms and Shipping Policy.</p>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white border border-[#D4C9B8] rounded-3xl p-8 sticky top-24">
            <div className="font-semibold tracking-tight text-xl mb-6">Order Summary</div>
            
            <div className="space-y-5 mb-8 text-sm">
              {items.map((item) => (
                <div key={`${item.id}-${item.selectedLength}`} className="flex gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0">
                    <ProductImage src={item.images[0]} alt={item.name} fill sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium leading-tight pr-2">{item.name}</div>
                    <div className="text-xs text-[#6B5F54]">{item.selectedLength} × {item.quantity}</div>
                  </div>
                  <div className="font-mono text-right whitespace-nowrap">₦{(item.currentPrice * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="border-t pt-5 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">₦{total.toLocaleString()}</span></div>
              <div className="flex justify-between text-[#6B5F54]"><span>Shipping</span><span>Calculated at confirmation</span></div>
              <div className="flex justify-between text-[#6B5F54]"><span>Tax</span><span>Included</span></div>
            </div>

            <div className="border-t mt-5 pt-5 flex justify-between text-2xl font-semibold">
              <span>Total</span>
              <span className="font-mono tabular-nums">₦{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}