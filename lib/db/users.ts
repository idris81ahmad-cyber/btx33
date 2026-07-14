import { eq } from "drizzle-orm";
import { getDb, schema } from "./index";
import { logger } from "@/lib/logger";

export async function getUserByEmail(email: string) {
  const db = getDb();
  if (!db) return null;
  try {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function getUserById(id: number) {
  const db = getDb();
  if (!db) return null;
  try {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  role?: "admin" | "customer";
  phone?: string;
}) {
  const db = getDb();
  if (!db) return null;
  try {
    const [user] = await db
      .insert(schema.users)
      .values({
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role ?? "customer",
        phone: data.phone,
      })
      .returning();
    return user;
  } catch (e) {
    logger.error("users", "createUser failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}