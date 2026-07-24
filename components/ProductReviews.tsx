"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, BadgeCheck, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Review {
  id: number;
  authorName: string;
  rating: number;
  title?: string | null;
  body: string;
  verified?: boolean | null;
  createdAt: string | Date;
}

interface ProductReviewsProps {
  productId: number;
  fallbackRating: number;
  fallbackCount: number;
}

export default function ProductReviews({ productId, fallbackRating, fallbackCount }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(fallbackRating);
  const [count, setCount] = useState(fallbackCount);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ authorName: "", rating: 5, title: "", body: "" });

  const loadReviews = useCallback(() => {
    setLoading(true);
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setAverageRating(data.averageRating ?? fallbackRating);
        setCount(data.count ?? fallbackCount);
      })
      .finally(() => setLoading(false));
  }, [productId, fallbackRating, fallbackCount]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, ...form, rating: Number(form.rating) }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Could not submit review");
      return;
    }
    const data = await res.json().catch(() => ({}));
    toast.success(
      data.message ||
        "Thank you! Your review was submitted and will appear after approval.",
    );
    setForm({ authorName: "", rating: 5, title: "", body: "" });
    // Only approved reviews show — no need to reload for pending
    if (!data.pending) loadReviews();
  };

  return (
    <div className="mt-12 pt-12 border-t border-[#D4C9B8]">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs tracking-[2px] text-[#C5A46E]">CUSTOMER REVIEWS</div>
          <h3 className="text-3xl tracking-tight font-semibold">What buyers say</h3>
        </div>
        <div className="flex items-center gap-3 bg-white border border-[#D4C9B8] rounded-2xl px-5 py-3">
          <div className="flex items-center gap-1 text-[#C5A46E]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? "fill-current" : "opacity-30"}`} />
            ))}
          </div>
          <span className="font-semibold">{averageRating.toFixed(1)}</span>
          <span className="text-sm text-[#6B5F54]">({count} reviews)</span>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Kwari verified</span>
        </div>
      </div>

      {/* Worn by / customer voice — ready for photos when reviews include media */}
      <section
        className="mb-10 rounded-3xl border border-[#E8DFD0] bg-gradient-to-br from-white to-[#FBF8F3] p-6 sm:p-8"
        aria-labelledby="worn-by-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] tracking-[0.2em] text-[#C5A46E] font-medium mb-1">
              WORN BY
            </div>
            <h4 id="worn-by-heading" className="text-xl font-semibold tracking-tight">
              Customer photos &amp; stories
            </h4>
            <p className="text-sm text-[#6B5F54] mt-1 max-w-xl leading-relaxed">
              As approved reviews arrive, highlights from real BIYORA buyers will appear here —
              including future customer photos of finished looks.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#6B2D3C]/10 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-[#6B2D3C]" aria-hidden="true" />
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-[#6B5F54]">Loading customer stories…</p>
        ) : reviews.length > 0 ? (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.slice(0, 6).map((r) => (
              <li
                key={`worn-${r.id}`}
                className="rounded-2xl border border-[#E8DFD0] bg-white p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6B2D3C]/20 to-[#C5A46E]/30 flex items-center justify-center text-xs font-semibold text-[#6B2D3C]"
                    aria-hidden="true"
                  >
                    {r.authorName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.authorName}</p>
                    <div className="flex text-[#C5A46E]">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#6B5F54] leading-relaxed line-clamp-4">
                  {r.body}
                </p>
                {r.verified && (
                  <p className="mt-2 text-[10px] text-emerald-700 inline-flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> Verified purchase
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D4C9B8] bg-white/70 px-5 py-8 text-center">
            <p className="text-sm text-[#6B5F54]">
              Be the first to share how you wore this fabric — leave a review below after your order.
            </p>
          </div>
        )}
      </section>

      {loading ? (
        <p className="text-[#6B5F54] text-sm mb-10">Loading reviews...</p>
      ) : reviews.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-[#D4C9B8] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{r.authorName}</div>
                <div className="flex items-center gap-0.5 text-[#C5A46E]">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              {r.title && <div className="font-semibold text-sm mb-1">{r.title}</div>}
              <p className="text-sm text-[#6B5F54] leading-relaxed">{r.body}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-[#6B5F54]">
                {r.verified && (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified purchase
                  </span>
                )}
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6B5F54] mb-10">No published reviews yet for this fabric.</p>
      )}

      <div className="bg-[#F8F4EC] border border-[#D4C9B8] rounded-3xl p-8">
        <h4 className="font-semibold text-lg mb-4">Write a review</h4>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Your name</Label>
            <Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} className="mt-1 rounded-xl" required />
          </div>
          <div>
            <Label>Rating</Label>
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              className="input-premium w-full rounded-xl px-4 py-2.5 mt-1 text-sm"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} stars</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Title (optional)</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 rounded-xl" />
          </div>
          <div className="md:col-span-2">
            <Label>Your experience</Label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
              className="input-premium w-full rounded-xl px-4 py-3 mt-1 resize-y text-sm"
              required
              minLength={10}
              placeholder="How was the fabric quality, colour, and delivery?"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting} className="bg-[#6B2D3C] rounded-xl">
              {submitting ? "Submitting..." : "Submit review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}