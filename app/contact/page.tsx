"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(20, "Please tell us more about your enquiry"),
});

type ContactForm = z.infer<typeof contactSchema>;

function ContactFormInner() {
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    const order = searchParams.get("order");
    const subject = searchParams.get("subject");
    if (subject) setValue("subject", subject);
    if (order) {
      setValue(
        "message",
        `Hello BIYORA SHOP team,\n\nI need help with my order ${order}.\n\nPlease assist with delivery / status details.\n\nThank you.`,
      );
      if (!subject) setValue("subject", `Order support — ${order}`);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (formData: ContactForm) => {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to send message");
      return;
    }
    toast.success("Message received!", {
      description: "Thank you. Our team will respond within 24 hours.",
    });
    reset();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="text-center mb-10">
        <div className="text-[#C5A46E] tracking-[3px] text-xs">WE&apos;D LOVE TO HEAR FROM YOU</div>
        <h1 className="text-6xl tracking-[-2px] font-semibold mt-2">Contact Us</h1>
      </div>

      <div className="grid md:grid-cols-5 gap-10">
        <div className="md:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs tracking-widest text-[#6B5F54]">YOUR NAME</label>
                <input {...register("name")} className="input-premium mt-1.5 w-full rounded-2xl px-5 py-3.5" />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-xs tracking-widest text-[#6B5F54]">EMAIL ADDRESS</label>
                <input {...register("email")} type="email" className="input-premium mt-1.5 w-full rounded-2xl px-5 py-3.5" />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs tracking-widest text-[#6B5F54]">SUBJECT</label>
              <input {...register("subject")} className="input-premium mt-1.5 w-full rounded-2xl px-5 py-3.5" placeholder="Wholesale enquiry, fabric recommendation..." />
              {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="text-xs tracking-widest text-[#6B5F54]">YOUR MESSAGE</label>
              <textarea {...register("message")} rows={7} className="input-premium mt-1.5 w-full rounded-2xl px-5 py-4 resize-y" placeholder="Hello BIYORA SHOP team, I am looking for..." />
              {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 rounded-2xl text-lg font-medium disabled:opacity-70"
            >
              {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-6 text-sm">
          <div className="bg-white border border-[#D4C9B8] rounded-3xl p-6">
            <div className="text-xs tracking-widest text-[#C5A46E] mb-3">VISIT & REACH US</div>
            <p className="text-[#6B5F54] leading-relaxed">
              Based in Kano with partners across Lagos. For wholesale and custom sourcing, WhatsApp is fastest.
            </p>
            <a href="https://wa.me/2349061811134" target="_blank" rel="noreferrer" className="block mt-4 hover:text-[#C5A46E] transition">
              +234 906 181 1134 (WhatsApp)
            </a>
            <p className="mt-2 text-[#6B5F54]">hello@biyorashop.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-6 py-20 text-center text-[#6B5F54]">
          Loading contact form…
        </div>
      }
    >
      <ContactFormInner />
    </Suspense>
  );
}
