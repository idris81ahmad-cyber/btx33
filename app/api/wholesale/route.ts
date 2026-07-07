import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema as dbSchema } from "@/lib/db";
import { Resend } from "resend";

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

    if (process.env.RESEND_API_KEY && process.env.CONTACT_INBOX_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "BIYORA SHOP <onboarding@resend.dev>",
        to: process.env.CONTACT_INBOX_EMAIL,
        subject: `Wholesale inquiry — ${body.company}`,
        html: `<p><strong>${body.contactName}</strong> at ${body.company}</p>
               <p>Email: ${body.email} | Phone: ${body.phone}</p>
               <p>Fabrics: ${body.fabricTypes}</p>
               <p>Quantity: ${body.estimatedQuantity}</p>
               <p>${body.message ?? ""}</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}