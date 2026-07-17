import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getReviewsByProductId, createReview } from "@/lib/db/reviews";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const productId = parseInt(req.nextUrl.searchParams.get("productId") || "", 10);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const reviews = await getReviewsByProductId(productId);
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({
    reviews,
    averageRating: Math.round(avg * 10) / 10,
    count: reviews.length,
  });
}

const reviewSchema = z.object({
  productId: z.number(),
  authorName: z.string().min(2),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`reviews:${ip}`, { limit: 8, windowMs: 60 * 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many reviews from this network. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = reviewSchema.parse(await req.json());
    const review = await createReview(body);
    if (!review) {
      return NextResponse.json({
        ok: true,
        message: "Review received (demo mode — awaiting moderation)",
        pending: true,
      });
    }
    return NextResponse.json(
      {
        review,
        pending: true,
        message: "Thanks! Your review is pending admin approval.",
      },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
