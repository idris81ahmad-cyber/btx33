"use client";

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

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

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

        <div className="md:col-span-2 text-sm text-[#6B5F54] space-y-8 pt-2">
          <div>
            <div className="font-semibold text-[#2C2522] tracking-tight mb-1">HEAD OFFICE</div>
            <div>Kantin Kwari Market<br />Kano, Nigeria</div>
          </div>
          <div>
            <div className="font-semibold text-[#2C2522] tracking-tight mb-1">CUSTOMER CARE</div>
            <a href="https://wa.me/2349061811134" target="_blank" className="block hover:text-[#C5A46E] transition">+234 906 181 1134 (WhatsApp)</a>
            <a href="mailto:biyorashop@gmail.com" className="block hover:text-[#C5A46E] transition">biyorashop@gmail.com</a>
          </div>
          <div>
            <div className="font-semibold text-[#2C2522] tracking-tight mb-1">BUSINESS HOURS</div>
            <div>Monday – Saturday: 8am – 7pm WAT<br />Sunday: Closed</div>
          </div>
          <div className="pt-4 border-t border-[#D4C9B8] text-xs">
            For wholesale, bulk orders, or collaborations with fashion designers and event planners, please reach out directly.
          </div>
        </div>
      </div>
    </div>
  );
}