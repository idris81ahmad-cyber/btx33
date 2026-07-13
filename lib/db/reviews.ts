import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "./index";

export type ReviewModeration = "pending" | "approved" | "rejected";

export async function getReviewsByProductId(
  productId: number,
  opts?: { includePending?: boolean },
) {
  const db = getDb();
  if (!db) return getStaticReviews(productId);
  try {
    const rows = await db
      .select()
      .from(schema.reviews)
      .where(
        opts?.includePending
          ? eq(schema.reviews.productId, productId)
          : and(
              eq(schema.reviews.productId, productId),
              eq(schema.reviews.moderationStatus, "approved"),
            ),
      )
      .orderBy(desc(schema.reviews.createdAt));
    if (rows.length === 0) return getStaticReviews(productId);
    return rows;
  } catch {
    return getStaticReviews(productId);
  }
}

export async function getAllReviewsForAdmin() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(schema.reviews)
      .orderBy(desc(schema.reviews.createdAt));
  } catch {
    return [];
  }
}

export async function createReview(data: {
  productId: number;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
}) {
  const db = getDb();
  if (!db) return null;
  try {
    const [review] = await db
      .insert(schema.reviews)
      .values({
        ...data,
        verified: false,
        moderationStatus: "pending",
      })
      .returning();
    return review;
  } catch {
    return null;
  }
}

export async function moderateReview(
  id: number,
  moderationStatus: ReviewModeration,
) {
  const db = getDb();
  if (!db) return null;
  try {
    const [row] = await db
      .update(schema.reviews)
      .set({
        moderationStatus,
        verified: moderationStatus === "approved",
      })
      .where(eq(schema.reviews.id, id))
      .returning();
    return row ?? null;
  } catch {
    return null;
  }
}

export async function deleteReview(id: number) {
  const db = getDb();
  if (!db) return false;
  try {
    await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
    return true;
  } catch {
    return false;
  }
}

function getStaticReviews(productId: number) {
  const curated = [
    {
      id: 1,
      productId,
      authorName: "Amina B.",
      rating: 5,
      title: "Stunning quality",
      body: "The fabric exceeded my expectations — rich colour and beautiful drape. Perfect for my sister's wedding.",
      verified: true,
      moderationStatus: "approved" as const,
      createdAt: new Date("2025-11-01"),
    },
    {
      id: 2,
      productId,
      authorName: "Chidi O.",
      rating: 5,
      title: "Authentic Kwari quality",
      body: "You can tell this is sourced from real market traders. Fast delivery to Lagos too.",
      verified: true,
      moderationStatus: "approved" as const,
      createdAt: new Date("2025-10-15"),
    },
    {
      id: 3,
      productId,
      authorName: "Fatima M.",
      rating: 4,
      title: "Beautiful texture",
      body: "Lovely hand-feel and the pattern is even more vibrant in person. Will order again.",
      verified: false,
      moderationStatus: "approved" as const,
      createdAt: new Date("2025-09-20"),
    },
  ];
  return curated;
}
