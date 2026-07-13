"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Trash2, Star } from "lucide-react";

type ReviewRow = {
  id: number;
  productId: number;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  moderationStatus: "pending" | "approved" | "rejected";
  createdAt: string;
};

export default function ReviewManager() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      const data = await res.json();
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: number, action: "approve" | "reject" | "delete") => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }
      toast.success(
        action === "approve"
          ? "Review approved"
          : action === "reject"
            ? "Review rejected"
            : "Review deleted",
      );
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const filtered =
    filter === "all"
      ? reviews
      : reviews.filter((r) => r.moderationStatus === filter);

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.moderationStatus === "pending").length,
    approved: reviews.filter((r) => r.moderationStatus === "approved").length,
    rejected: reviews.filter((r) => r.moderationStatus === "rejected").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize min-h-[36px] ${
              filter === f
                ? "bg-[#6B2D3C] text-white border-[#6B2D3C]"
                : "bg-white border-[#D4C9B8] text-[#6B5F54]"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 py-1.5 text-xs border border-[#D4C9B8] rounded-full min-h-[36px]"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#D4C9B8] rounded-2xl p-10 text-center text-[#6B5F54] text-sm">
          No {filter === "all" ? "" : filter} reviews.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="bg-white border border-[#D4C9B8] rounded-2xl p-4 md:p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.authorName}</span>
                    <span className="flex text-[#C5A46E]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`}
                        />
                      ))}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-[#D4C9B8] text-[#6B5F54]">
                      {r.moderationStatus}
                    </span>
                  </div>
                  {r.title && (
                    <p className="text-sm font-medium mt-1">{r.title}</p>
                  )}
                  <p className="text-sm text-[#6B5F54] mt-1 leading-relaxed">{r.body}</p>
                  <p className="text-[10px] text-[#A89B8A] mt-2">
                    Product #{r.productId} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {r.moderationStatus !== "approved" && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void act(r.id, "approve")}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 min-h-[40px] disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {r.moderationStatus !== "rejected" && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void act(r.id, "reject")}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs rounded-xl bg-amber-50 text-amber-900 border border-amber-200 min-h-[40px] disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => {
                      if (confirm("Delete this review permanently?")) {
                        void act(r.id, "delete");
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200 min-h-[40px] disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
