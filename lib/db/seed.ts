import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase, schema } from "./index";
import { getDefaultProducts } from "@/lib/products-defaults";
import { logger } from "@/lib/logger";

/**
 * Bootstrap admins only from environment — never from hardcoded passwords.
 *
 * Set on first deploy (Production):
 *   ADMIN_EMAIL=you@yourdomain.com
 *   ADMIN_PASSWORD=long-random-secret
 *
 * Optional: ADMIN_NAME=BIYORA Admin
 */
export async function seedAdminUsers(): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "BIYORA SHOP Admin";

  if (!email || !password) {
    logger.warn(
      "seed",
      "Skipping admin seed — set ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap an admin",
    );
    return 0;
  }

  if (password.length < 12) {
    logger.error("seed", "ADMIN_PASSWORD must be at least 12 characters");
    return 0;
  }

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    // Only rotate when explicitly requested
    if (process.env.ADMIN_FORCE_PASSWORD === "1") {
      await db
        .update(schema.users)
        .set({ passwordHash, role: "admin", name })
        .where(eq(schema.users.id, existing.id));
      logger.ops("seed", "Admin password rotated via ADMIN_FORCE_PASSWORD", {
        email,
      });
      return 1;
    }
    return 0;
  }

  await db.insert(schema.users).values({
    email,
    name,
    passwordHash,
    role: "admin",
  });
  logger.ops("seed", "Admin user created from ADMIN_EMAIL", { email });
  return 1;
}

export async function seedProducts(force = false): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  const products = getDefaultProducts();
  if (products.length === 0) return 0;

  if (!force) {
    const [existing] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .limit(1);
    if (existing) return 0;
  } else {
    await db.delete(schema.products);
  }

  for (const product of products) {
    await db.insert(schema.products).values({
      slug: product.slug,
      name: product.name,
      category: product.category,
      price: product.price,
      salePrice: product.salePrice ?? null,
      images: product.images,
      rating: product.rating,
      reviewCount: product.reviewCount,
      shortDescription: product.shortDescription,
      description: product.description,
      inStock: product.inStock,
      colorFamily: product.colorFamily,
      patternStyle: product.patternStyle,
      lengthOptions: product.lengthOptions,
      specifications: product.specifications,
    });
  }

  return products.length;
}

export async function runDatabaseSeed(options?: { forceProducts?: boolean }) {
  if (!hasDatabase()) {
    throw new Error("POSTGRES_URL is not set");
  }

  const admins = await seedAdminUsers();
  const products = await seedProducts(options?.forceProducts ?? false);

  return { admins, products };
}
