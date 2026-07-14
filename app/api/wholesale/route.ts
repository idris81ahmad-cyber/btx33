import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema as dbSchema } from "@/lib/db";
import { sendWholesaleInquiryEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const inquirySchema = z.object({
  company: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  fabricTypes: z.string().min(3),
  estimatedQuantity: z.string().min(2),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = inquirySchema.parse(await req.json());
    const db = getDb();
    if (db) {
      await db.insert(dbSchema.wholesaleInquiries).values(body);
    }

    // Best-effort notify — inquiry is already stored when DB is available
    const emailResult = await sendWholesaleInquiryEmail(body);
    if (!emailResult.ok && !emailResult.demo) {
      logger.warn("wholesale", "Inquiry saved but notify email failed", {
        company: body.company,
        error: emailResult.error,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}