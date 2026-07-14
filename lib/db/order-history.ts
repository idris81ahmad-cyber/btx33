import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "./index";
import { logger } from "@/lib/logger";

export type StatusHistoryRow = {
  id: number;
  orderNumber: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  actor: string;
  createdAt: Date | string;
};

export async function appendOrderStatusHistory(input: {
  orderNumber: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string;
  actor?: string;
}) {
  const db = getDb();
  if (!db) return null;
  try {
    const [row] = await db
      .insert(schema.orderStatusHistory)
      .values({
        orderNumber: input.orderNumber,
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus,
        note: input.note,
        actor: input.actor ?? "system",
      })
      .returning();
    return row;
  } catch (e) {
    logger.error("order-history", "appendOrderStatusHistory failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

export async function getOrderStatusHistory(orderNumber: string): Promise<StatusHistoryRow[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(schema.orderStatusHistory)
      .where(eq(schema.orderStatusHistory.orderNumber, orderNumber))
      .orderBy(asc(schema.orderStatusHistory.createdAt));
  } catch {
    return [];
  }
}
