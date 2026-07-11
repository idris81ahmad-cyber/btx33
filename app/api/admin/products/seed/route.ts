import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { seedAdminUsers } from "@/lib/db/seed";
import { forceSeedProductsToDb } from "@/lib/products-store";

export async function POST() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "POSTGRES_URL is not configured. Connect Vercel Postgres first." },
      { status: 503 },
    );
  }

  try {
    const admins = await seedAdminUsers();
    const products = await forceSeedProductsToDb();

    return NextResponse.json({
      success: true,
      message:
        products === 0 && admins === 0
          ? "Database already seeded"
          : `Seeded ${products} product(s) and ${admins} admin user(s)`,
      seeded: { products, admins },
    });
  } catch (error) {
    console.error("Seed database error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}