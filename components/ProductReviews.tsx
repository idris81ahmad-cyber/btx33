"use client";

import { useEffect, useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
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

  const loadReviews = () => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setAverageRating(data.averageRating ?? fallbackRating);
        setCount(data.count ?? fallbackCount);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

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
    toast.success("Thank you for your review!");
    setForm({ authorName: "", rating: 5, title: "", body: "" });
    loadReviews();
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

      {loading ? (
        <p className="text-[#6B5F54] text-sm">Loading reviews...</p>
      ) : (
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