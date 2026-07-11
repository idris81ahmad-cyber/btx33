import { eq } from "drizzle-orm";
import { getDb, hasDatabase, schema } from "./index";
import { getDefaultProducts } from "@/lib/products-defaults";

/** Pre-hashed passwords match legacy admin credentials in lib/auth.ts */
const ADMIN_SEEDS = [
  {
    email: "admin@biyorashop.com",
    name: "BIYORA SHOP Admin",
    passwordHash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    role: "admin" as const,
  },
  {
    email: "halifa@biyorashop.com",
    name: "Halifa Admin",
    passwordHash: "$2b$10$NHjw7GrEcNuRFzc0ohscbelRgHmN41fJoJ55KhbQ0GoF0FaAvDRmW",
    role: "admin" as const,
  },
];

export async function seedAdminUsers(): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  let created = 0;
  for (const admin of ADMIN_SEEDS) {
    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, admin.email.toLowerCase()))
      .limit(1);

    if (existing) continue;

    await db.insert(schema.users).values({
      email: admin.email.toLowerCase(),
      name: admin.name,
      passwordHash: admin.passwordHash,
      role: admin.role,
    });
    created++;
  }

  return created;
}

export async function seedProducts(force = false): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  const products = getDefaultProducts();
  if (products.length === 0) return 0;

  if (!force) {
    const [existing] = await db.select({ id: schema.products.id }).from(schema.products).limit(1);
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