import { and, eq } from "drizzle-orm";
import { getDb, schema } from "./index";

export async function getAddressesByUserId(userId: number) {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(schema.addresses).where(eq(schema.addresses.userId, userId));
  } catch {
    return [];
  }
}

export async function createAddress(data: {
  userId: number;
  label?: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  isDefault?: boolean;
}) {
  const db = getDb();
  if (!db) return null;
  try {
    if (data.isDefault) {
      await db.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.userId, data.userId));
    }
    const [addr] = await db.insert(schema.addresses).values(data).returning();
    return addr;
  } catch {
    return null;
  }
}

export async function deleteAddress(id: number, userId: number) {
  const db = getDb();
  if (!db) return false;
  try {
    await db.delete(schema.addresses).where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, userId)));
    return true;
  } catch {
    return false;
  }
}