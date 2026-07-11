"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { MessageCircle, Package, TrendingDown } from "lucide-react";

const tiers = [
  { min: "10–49 yards", discount: "5% off retail", note: "Small boutique or event" },
  { min: "50–199 yards", discount: "12% off retail", note: "Asoebi coordinator" },
  { min: "200+ yards", discount: "Custom pricing", note: "Retailers & exporters" },
];

const schema = z.object({
  company: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  fabricTypes: z.string().min(3),
  estimatedQuantity: z.string().min(2),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WholesalePage() {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const res = await fetch("/api/wholesale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error("Could not submit inquiry");
      return;
    }
    toast.success("Inquiry received!", { description: "Our wholesale team will contact you within 24 hours." });
    reset();
  };

  const whatsappMsg = encodeURIComponent(
    "Hello BIYORA SHOP, I\u2019m interested in wholesale fabrics from Kantin Kwari. Please share your bulk price list.",
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-14 pb-24">
      <div className="max-w-2xl mb-12">
        <div className="text-xs tracking-[3px] text-[#C5A46E]">B2B • KANTIN KWARI</div>
        <h1 className="text-5xl font-semibold tracking-tight mt-2">Wholesale &amp; Bulk Orders</h1>
        <p className="text-[#6B5F54] mt-4 text-lg leading-relaxed">
          Direct from verified Kano sources. Whether you coordinate Asoebi for 500 guests or stock a boutique in Lagos, London, or Houston — we scale with you.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {tiers.map((t) => (
          <div key={t.min} className="bg-white border border-[#D4C9B8] rounded-3xl p-6">
            <Package className="w-6 h-6 text-[#C5A46E] mb-3" />
            <div className="font-semibold text-lg">{t.min}</div>
            <div className="text-[#6B2D3C] font-medium mt-1">{t.discount}</div>
            <div className="text-sm text-[#6B5F54] mt-2">{t.note}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-10">
        <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-3 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest text-[#6B5F54]">COMPANY / BRAND</label>
              <input {...register("company")} className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5" />
              {errors.company && <p className="text-xs text-red-600 mt-1">{errors.company.message}</p>}
            </div>
            <div>
              <label className="text-xs tracking-widest text-[#6B5F54]">CONTACT NAME</label>
              <input {...register("contactName")} className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5" />
              {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName.message}</p>}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest text-[#6B5F54]">EMAIL</label>
              <input {...register("email")} type="email" className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5" />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs tracking-widest text-[#6B5F54]">PHONE / WHATSAPP</label>
              <input {...register("phone")} className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5" />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs tracking-widest text-[#6B5F54]">FABRIC TYPES NEEDED</label>
            <input {...register("fabricTypes")} placeholder="Ankara, Swiss lace, Shadda..." className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5" />
            {errors.fabricTypes && <p className="text-xs text-red-600 mt-1">{errors.fabricTypes.message}</p>}
          </div>
          <div>
            <label className="text-xs tracking-widest text-[#6B5F54]">ESTIMATED QUANTITY</label>
            <input {...register("estimatedQuantity")} placeholder="e.g. 150 yards Ankara, 80 yards lace" className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5" />
            {errors.estimatedQuantity && <p className="text-xs text-red-600 mt-1">{errors.estimatedQuantity.message}</p>}
          </div>
          <div>
            <label className="text-xs tracking-widest text-[#6B5F54]">ADDITIONAL DETAILS</label>
            <textarea {...register("message")} rows={4} className="input-premium w-full rounded-2xl px-4 py-3 mt-1.5 resize-y" placeholder="Delivery timeline, colour preferences, event date..." />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-4 rounded-2xl text-lg disabled:opacity-70">
            {submitting ? "SUBMITTING..." : "SUBMIT WHOLESALE INQUIRY"}
          </button>
        </form>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#F8F4EC] border border-[#D4C9B8] rounded-3xl p-6">
            <TrendingDown className="w-6 h-6 text-[#6B2D3C] mb-3" />
            <div className="font-semibold mb-2">Why buy bulk from BIYORA?</div>
            <ul className="text-sm text-[#6B5F54] space-y-2">
              <li>✓ Same Kantin Kwari quality as retail</li>
              <li>✓ Consistent dye lots for Asoebi</li>
              <li>✓ Nationwide &amp; international shipping</li>
              <li>✓ Dedicated account manager</li>
            </ul>
          </div>
          <a
            href={`https://wa.me/2348091234567?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-emerald-600 text-white rounded-2xl px-6 py-4 font-medium hover:bg-emerald-700 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp instead
          </a>
          <p className="text-xs text-[#6B5F54]">
            Minimum wholesale order: 10 yards per fabric type. Mixed bundles available for events.
          </p>
        </div>
      </div>
    </div>
  );
}