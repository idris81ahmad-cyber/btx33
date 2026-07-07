import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactReply } from "@/lib/email";
const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(20),
});

export async function POST(req: Request) {
  try {
    const body = contactSchema.parse(await req.json());

    await sendContactReply({
      to: body.email,
      name: body.name,
      subject: body.subject,
      message: body.message,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}