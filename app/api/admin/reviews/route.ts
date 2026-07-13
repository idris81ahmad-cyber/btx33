import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  deleteReview,
  getAllReviewsForAdmin,
  moderateReview,
} from "@/lib/db/reviews";
import { hasDatabase } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json({ reviews: [], message: "Database not configured" });
  }

  const reviews = await getAllReviewsForAdmin();
  return NextResponse.json({ reviews });
}

const patchSchema = z.object({
  id: z.number(),
  action: z.enum(["approve", "reject", "delete"]),
});

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = patchSchema.parse(await req.json());
    if (body.action === "delete") {
      const ok = await deleteReview(body.id);
      if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
      return NextResponse.json({ ok: true, deleted: true });
    }

    const status = body.action === "approve" ? "approved" : "rejected";
    const row = await moderateReview(body.id, status);
    if (!row) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    return NextResponse.json({ ok: true, review: row });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to moderate review" }, { status: 500 });
  }
}
